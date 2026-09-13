import { klasa1Tasks } from './klasa1/tasks'
import { klasa2Tasks } from './klasa2/tasks'
import { klasa3Tasks } from './klasa3/tasks'
import { klasa4Tasks } from './klasa4/tasks'
import type { Grade, Task, TopicId } from '../types'

export const ALL_TASKS: Task[] = [...klasa1Tasks, ...klasa2Tasks, ...klasa3Tasks, ...klasa4Tasks]
export type TaskPool = 'learn' | 'quiz' | 'exam'

export function getTasksForGrade(klasa: Grade): Task[] {
  if (klasa === 3) {
    return ALL_TASKS.filter(
      (task) => task.klasa === 3 || (task.klasa === 4 && task.id.startsWith('k4-w25-')),
    )
  }
  return ALL_TASKS.filter((t) => t.klasa === klasa)
}

function normalizeFingerprintPart(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pl')
}

/** Identyczna treść i identyczne wartości opcji zawsze dają ten sam odcisk. */
export function getTaskFingerprint(task: Task): string {
  const options = Object.values(task.opcje).map(normalizeFingerprintPart).sort()
  return JSON.stringify([normalizeFingerprintPart(task.tresc), options])
}

function partitionTasks(
  tasks: Task[],
  assignedFingerprints = new Map<string, TaskPool>(),
): Record<TaskPool, Task[]> {
  const result: Record<TaskPool, Task[]> = { learn: [], quiz: [], exam: [] }
  const topics = Array.from(new Set(tasks.map(({ dzial }) => dzial))).sort()

  for (const topic of topics) {
    const groups = new Map<string, Task[]>()
    for (const task of tasks.filter(({ dzial }) => dzial === topic)) {
      const fingerprint = getTaskFingerprint(task)
      const group = groups.get(fingerprint) ?? []
      group.push(task)
      groups.set(fingerprint, group)
    }

    const orderedGroups = Array.from(groups.entries()).sort(([left], [right]) =>
      left.localeCompare(right, 'pl'),
    )
    const learnEnd = Math.max(1, Math.floor(orderedGroups.length * 0.5))
    const quizEnd = Math.min(
      orderedGroups.length - 1,
      Math.max(learnEnd + 1, learnEnd + Math.floor(orderedGroups.length * 0.2)),
    )

    orderedGroups.forEach(([fingerprint, group], index) => {
      const suggestedPool: TaskPool =
        index < learnEnd ? 'learn' : index < quizEnd ? 'quiz' : 'exam'
      const pool = assignedFingerprints.get(fingerprint) ?? suggestedPool
      assignedFingerprints.set(fingerprint, pool)
      result[pool].push(...group)
    })
  }

  return result
}

const GLOBAL_POOL_BY_FINGERPRINT = (() => {
  const assignments = new Map<string, TaskPool>()
  for (const grade of [1, 2, 3, 4] as const) {
    partitionTasks(
      ALL_TASKS.filter((task) => task.klasa === grade),
      assignments,
    )
  }
  return assignments
})()

export function getTasksForPool(klasa: Grade, pool: TaskPool): Task[] {
  return getTasksForGrade(klasa).filter(
    (task) => GLOBAL_POOL_BY_FINGERPRINT.get(getTaskFingerprint(task)) === pool,
  )
}

export function getTasksByTopic(klasa: Grade, topic: TopicId, pool?: TaskPool): Task[] {
  const tasks = pool ? getTasksForPool(klasa, pool) : getTasksForGrade(klasa)
  return tasks.filter((task) => task.dzial === topic)
}

export function getTaskById(id: string): Task | undefined {
  return ALL_TASKS.find((t) => t.id === id)
}

export { TOPICS, GRADES } from './meta'
