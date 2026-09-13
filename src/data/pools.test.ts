import { describe, expect, it } from 'vitest'
import { generatePoolTasks, generateVariant } from '../engine/variants/generate'
import { validateGeneratedTask } from '../engine/variants/validate'
import { getTaskFingerprint, loadTasksForGrade } from './index'
import { klasa1Generated } from './generated/klasa1'
import { klasa2Generated } from './generated/klasa2'
import { klasa3Generated } from './generated/klasa3'
import { klasa4Generated } from './generated/klasa4'
import type { GeneratedTask } from '../domain/taskSeed'

const GENERATED: GeneratedTask[] = [
  ...klasa1Generated,
  ...klasa2Generated,
  ...klasa3Generated,
  ...klasa4Generated,
]

/** Oczekiwane liczby pytań archiwalnych = liczebności puli exam (manifest 40 arkuszy, 1048 pytań). */
const EXPECTED_EXAM: Record<number, number> = { 1: 264, 2: 275, 3: 224, 4: 285 }

describe('jawne pule zadań', () => {
  it('generator jest deterministyczny', () => {
    const first = generateVariant(2, 'geometria', 'quiz', 3)
    const second = generateVariant(2, 'geometria', 'quiz', 3)
    expect(second).toEqual(first)

    const poolA = generatePoolTasks({ grade: 1, pool: 'quiz', count: 12 })
    const poolB = generatePoolTasks({ grade: 1, pool: 'quiz', count: 12 })
    expect(poolB).toEqual(poolA)
  })

  it('pula exam pokrywa wszystkie pytania archiwalne', () => {
    for (const [gradeRaw, expected] of Object.entries(EXPECTED_EXAM)) {
      const grade = Number(gradeRaw)
      const exam = GENERATED.filter((task) => task.klasa === grade && task.pool === 'exam')
      expect(exam.length).toBe(expected)

      const pairs = new Set<string>()
      for (const task of exam) {
        expect(task.variant).toBe(0)
        expect(task.archiveRef).toBeDefined()
        expect(task.archiveRef?.sheet.startsWith(`kl${grade}-`)).toBe(true)
        expect(task.archiveRef?.number ?? 0).toBeGreaterThanOrEqual(1)
        pairs.add(`${task.archiveRef?.sheet}#${task.archiveRef?.number}`)
      }
      // Każde pytanie archiwalne ma dokładnie jedną parafrazę.
      expect(pairs.size).toBe(expected)
    }
  })

  it('zadania learn i quiz nie mają odwołań archiwalnych', () => {
    for (const task of GENERATED.filter((t) => t.pool !== 'exam')) {
      expect(task.archiveRef, task.id).toBeUndefined()
      expect(task.variant, task.id).toBeGreaterThan(0)
    }
  })

  it('klucz każdego próbkowanego zadania przechodzi walidację rachunkową', () => {
    const sample = [1, 2, 3, 4].flatMap((grade) =>
      GENERATED.filter((task) => task.klasa === grade).filter((_, i) => i % 37 === 0),
    )
    expect(sample.length).toBeGreaterThan(30)
    for (const task of sample) {
      expect(validateGeneratedTask(task), task.id).toEqual([])
    }
  })

  it('ilustracje mają poprawne parametry', () => {
    const kinds = ['clock', 'shapes', 'domino', 'number-line', 'bars', 'grid']
    let count = 0
    for (const task of GENERATED) {
      const illustration = task.illustration
      if (!illustration) continue
      count += 1
      expect(kinds, task.id).toContain(illustration.kind)
      if (illustration.kind === 'clock') {
        expect(illustration.hour, task.id).toBeGreaterThanOrEqual(0)
        expect(illustration.hour, task.id).toBeLessThanOrEqual(23)
        expect(illustration.minute, task.id).toBeGreaterThanOrEqual(0)
        expect(illustration.minute, task.id).toBeLessThanOrEqual(59)
      }
    }
    expect(count).toBeGreaterThan(50)
  })

  it('lader klasowy zwraca pełne bazy bez duplikatów', async () => {
    for (const grade of [1, 2, 3, 4] as const) {
      const tasks = await loadTasksForGrade(grade)
      expect(tasks.length).toBeGreaterThan(300)
      expect(new Set(tasks.map(({ id }) => id)).size).toBe(tasks.length)
      const prints = tasks.map(getTaskFingerprint)
      expect(new Set(prints).size).toBe(prints.length)
    }
  })
})
