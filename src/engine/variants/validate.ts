import type { GeneratedTask, TaskPool } from '../../domain/taskSeed'
import type { Grade } from '../../types'
import { scoreTask } from '../scoring.ts'

export interface ValidationIssue {
  taskId: string
  rule: string
  message: string
}

function norm(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pl')
}

export function fingerprintOf(tresc: string, opcje: Record<string, string | undefined>): string {
  const options = Object.values(opcje)
    .filter((v): v is string => typeof v === 'string')
    .map(norm)
    .sort()
  return JSON.stringify([norm(tresc), options])
}

/** Walidacja strukturalna + rachunkowa pojedynczego zadania. */
export function validateGeneratedTask(task: GeneratedTask): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const fail = (rule: string, message: string) => issues.push({ taskId: task.id, rule, message })

  const values = Object.values(task.opcje).filter((v): v is string => typeof v === 'string')
  if (values.length !== 4) fail('options-count', `oczekiwano 4 opcji, jest ${values.length}`)
  if (new Set(values.map(norm)).size !== values.length) fail('options-unique', 'opcje powtarzają się')
  for (const key of task.poprawne) {
    if (task.opcje[key] === undefined) fail('correct-exists', `brak opcji ${key}`)
  }
  if (task.typ === 'single' && task.poprawne.length !== 1) fail('type-single', 'single wymaga 1 poprawnej')
  if (task.typ === 'multi' && task.poprawne.length < 2) fail('type-multi', 'multi wymaga min. 2 poprawnych')
  if (task.typ === 'none' && task.poprawne.length !== 0) fail('type-none', 'none wymaga 0 poprawnych')
  if (task.poprawne.length > 1 && task.typ !== 'multi') fail('type-multi-mismatch', 'wiele poprawnych wymaga multi')

  const scored = scoreTask(task, task.poprawne)
  if (!scored.correct || scored.points !== scored.maxPoints) {
    fail('scoring-smoke', 'klucz odpowiedzi nie daje maksymalnej punktacji')
  }

  if (!task.seedId) fail('seed', 'brak seedId')
  if (!task.pool) fail('pool', 'brak jawnej puli')
  if (task.pool === 'exam' && !task.archiveRef) fail('archive', 'zadanie exam bez archiveRef')
  if (task.pool !== 'exam' && task.archiveRef) fail('archive', 'zadanie spoza exam z archiveRef')

  return issues
}

export interface PoolExpectation {
  grade: Grade
  pool: TaskPool
  minCount: number
}

/** Walidacja całych pul: liczebność, rozłączność fingerprintów, pokrycie archiwum. */
export function validatePools(
  tasks: GeneratedTask[],
  legacy: { id: string; tresc: string; opcje: Record<string, string | undefined> }[],
  expectations: PoolExpectation[],
  archivePairs: { sheet: string; number: number }[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const fail = (taskId: string, rule: string, message: string) =>
    issues.push({ taskId, rule, message })

  for (const task of tasks) {
    for (const issue of validateGeneratedTask(task)) issues.push(issue)
  }

  const ids = tasks.map((t) => t.id)
  if (new Set(ids).size !== ids.length) fail('-', 'ids-unique', 'zduplikowane ID zadań')

  for (const { grade, pool, minCount } of expectations) {
    const count = tasks.filter((t) => t.klasa === grade && t.pool === pool).length
    if (count < minCount) {
      fail('-', 'pool-size', `klasa ${grade} pula ${pool}: jest ${count}, wymagane min. ${minCount}`)
    }
  }

  // Rozłączność fingerprintów między pulami — także względem bazy legacy.
  // Duplikaty wewnątrz samej bazy legacy zgłaszamy osobno (ostrzeżenie, nie błąd).
  const prints = new Map<string, string>()
  const legacyPrints = new Map<string, string>()
  for (const t of legacy) {
    const fp = fingerprintOf(t.tresc, t.opcje)
    const prev = legacyPrints.get(fp)
    if (prev && prev !== t.id) {
      fail(`legacy:${t.id}`, 'legacy-duplicate', `identyczne zadanie legacy: ${prev}`)
    } else {
      legacyPrints.set(fp, t.id)
    }
    prints.set(fp, `legacy:${t.id}`)
  }
  for (const t of tasks) {
    const fp = fingerprintOf(t.tresc, t.opcje)
    const owner = `${t.klasa}/${t.pool}:${t.id}`
    const prev = prints.get(fp)
    if (prev) {
      fail(owner, 'pool-disjoint', `identyczne zadanie występuje także w ${prev}`)
    } else {
      prints.set(fp, owner)
    }
  }

  // Każde pytanie archiwalne ma dokładnie jedną parafrazę w exam.
  const seen = new Map<string, number>()
  for (const t of tasks) {
    if (t.pool !== 'exam' || !t.archiveRef) continue
    const key = `${t.archiveRef.sheet}#${t.archiveRef.number}`
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  for (const pair of archivePairs) {
    const key = `${pair.sheet}#${pair.number}`
    const n = seen.get(key) ?? 0
    if (n !== 1) fail(key, 'archive-coverage', `parafraz w exam: ${n}, oczekiwano 1`)
  }

  return issues
}
