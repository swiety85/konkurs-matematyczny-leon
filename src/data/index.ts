import { klasa1Tasks } from './klasa1/tasks'
import { klasa3Tasks } from './klasa3/tasks'
import { klasa4Tasks } from './klasa4/tasks'
import type { Grade, Task, TopicId } from '../types'

export const ALL_TASKS: Task[] = [...klasa1Tasks, ...klasa3Tasks, ...klasa4Tasks]

export function getTasksForGrade(klasa: Grade): Task[] {
  if (klasa === 3) {
    return ALL_TASKS.filter(
      (task) => task.klasa === 3 || (task.klasa === 4 && task.id.startsWith('k4-w25-')),
    )
  }
  return ALL_TASKS.filter((t) => t.klasa === klasa)
}

export function getTasksByTopic(klasa: Grade, topic: TopicId): Task[] {
  return getTasksForGrade(klasa).filter((t) => t.dzial === topic)
}

export function getTaskById(id: string): Task | undefined {
  return ALL_TASKS.find((t) => t.id === id)
}

export { TOPICS, GRADES } from './meta'
