import { useEffect, useState } from 'react'
import type { Grade, Task, TopicId } from '../types'
import type { TaskPool } from '../domain/taskSeed'
import { loadTasksByTopic, loadTasksForPool } from '../data'

/** Leniwie ładuje pulę klasy (chunk generowany pobierany jest tylko raz). */
export function usePoolTasks(grade: Grade, pool: TaskPool): Task[] | null {
  const [tasks, setTasks] = useState<Task[] | null>(null)

  useEffect(() => {
    let live = true
    setTasks(null)
    void loadTasksForPool(grade, pool).then((loaded) => {
      if (live) setTasks(loaded)
    })
    return () => {
      live = false
    }
  }, [grade, pool])

  return tasks
}

/** Leniwie ładuje zadania jednego działu z wybranej puli. */
export function useTopicTasks(
  grade: Grade,
  topic: TopicId | null,
  pool: TaskPool,
): Task[] | null {
  const [tasks, setTasks] = useState<Task[] | null>(null)

  useEffect(() => {
    if (!topic) {
      setTasks(null)
      return
    }
    let live = true
    setTasks(null)
    void loadTasksByTopic(grade, topic, pool).then((loaded) => {
      if (live) setTasks(loaded)
    })
    return () => {
      live = false
    }
  }, [grade, topic, pool])

  return tasks
}
