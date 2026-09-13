import { klasa1Tasks } from './klasa1/tasks'
import { klasa2Tasks } from './klasa2/tasks'
import { klasa3Tasks } from './klasa3/tasks'
import { klasa4Tasks } from './klasa4/tasks'
import type { Grade, Task, TopicId } from '../types'
import type { GeneratedTask, TaskPool } from '../domain/taskSeed'

export type { TaskPool } from '../domain/taskSeed'

/** Baza legacy (417 zadań): synchroniczna, cała w głównym bundlu. */
export const LEGACY_TASKS: Task[] = [...klasa1Tasks, ...klasa2Tasks, ...klasa3Tasks, ...klasa4Tasks]

/** Jawna pula zadania. Zadania generowane niosą ją w sobie, legacy to pula nauki. */
export function poolOf(task: Task): TaskPool {
  const pool = (task as Partial<GeneratedTask>).pool
  return pool ?? 'learn'
}

function normalizeFingerprintPart(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pl')
}

/** Identyczna treść i identyczne wartości opcji zawsze dają ten sam odcisk. */
export function getTaskFingerprint(task: Task): string {
  const options = Object.values(task.opcje).map(normalizeFingerprintPart).sort()
  return JSON.stringify([normalizeFingerprintPart(task.tresc), options])
}

/** Synchroniczny podzbiór legacy (reguła mostka: klasa 3 widzi też k4-w25-*). */
export function legacyTasksForGrade(klasa: Grade): Task[] {
  if (klasa === 3) {
    return LEGACY_TASKS.filter(
      (task) => task.klasa === 3 || (task.klasa === 4 && task.id.startsWith('k4-w25-')),
    )
  }
  return LEGACY_TASKS.filter((t) => t.klasa === klasa)
}

/**
 * Leniwe chunki z zadaniami generowanymi — jeden chunk na klasę.
 * Dzięki import.meta.glob pula exam/quiz/learn (~1459 zadań) nie wchodzi do początkowego bundla.
 */
const generatedLoaders: Record<string, () => Promise<unknown>> = import.meta.glob(
  './generated/klasa*.ts',
)
const generatedCache = new Map<Grade, GeneratedTask[]>()
const idCache = new Map<string, Task>(LEGACY_TASKS.map((task) => [task.id, task]))

export async function loadGeneratedForGrade(klasa: Grade): Promise<GeneratedTask[]> {
  const hit = generatedCache.get(klasa)
  if (hit) return hit
  const loader = generatedLoaders[`./generated/klasa${klasa}.ts`]
  if (!loader) return []
  const mod = (await loader()) as Record<string, GeneratedTask[]>
  const tasks = Object.values(mod)[0] ?? []
  generatedCache.set(klasa, tasks)
  for (const task of tasks) idCache.set(task.id, task)
  return tasks
}

/** Pełna baza klasy: legacy synchroniczne + leniwy chunk generowany. */
export async function loadTasksForGrade(klasa: Grade): Promise<Task[]> {
  const generated = await loadGeneratedForGrade(klasa)
  if (klasa === 3) {
    return [...legacyTasksForGrade(3), ...generated.filter((task) => task.klasa === 3)]
  }
  return [...legacyTasksForGrade(klasa), ...generated]
}

export async function loadTasksForPool(klasa: Grade, pool: TaskPool): Promise<Task[]> {
  return (await loadTasksForGrade(klasa)).filter((task) => poolOf(task) === pool)
}

export async function loadTasksByTopic(
  klasa: Grade,
  topic: TopicId,
  pool?: TaskPool,
): Promise<Task[]> {
  const tasks = pool ? await loadTasksForPool(klasa, pool) : await loadTasksForGrade(klasa)
  return tasks.filter((task) => task.dzial === topic)
}

/** Zadanie po ID — działa dla legacy od razu, dla generowanych po pierwszym load danej klasy. */
export function getTaskById(id: string): Task | undefined {
  return idCache.get(id)
}

export { TOPICS, GRADES } from './meta'
