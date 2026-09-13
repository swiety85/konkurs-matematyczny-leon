import type { Task, TopicId, UserProfile } from '../types'
import { getDueTopics, getWeakTopics, MASTERY_THRESHOLD } from './storage'

/** Waga losowania: wyższa = częściej wybieramy dział. */
export function topicWeight(profile: UserProfile, topic: TopicId): number {
  const stats = profile.topicStats[topic]
  if (!stats || stats.attempts === 0) return 2.5

  const weakness = 1 - stats.mastery
  const dueBoost =
    stats.nextReviewAt && stats.nextReviewAt <= Date.now()
      ? 2
      : stats.mastery < MASTERY_THRESHOLD
        ? 1.2
        : 0.6

  return Math.max(0.3, weakness * 3 + dueBoost)
}

export function pickWeightedTopics(profile: UserProfile, topics: TopicId[], count: number): TopicId[] {
  const pool = [...topics]
  const result: TopicId[] = []

  while (result.length < count && pool.length > 0) {
    const weights = pool.map((t) => topicWeight(profile, t))
    const sum = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * sum
    let idx = 0
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i]
      if (r <= 0) {
        idx = i
        break
      }
    }
    result.push(pool[idx])
  }

  return result
}

/** Dobiera zadania z naciskiem na słabe działy + przeplatanie (interleaving). */
export function selectAdaptiveTasks(
  allTasks: Task[],
  profile: UserProfile,
  count: number,
  options?: { topics?: TopicId[]; preferDue?: boolean },
): Task[] {
  const topics = options?.topics ?? Array.from(new Set(allTasks.map((t) => t.dzial)))
  const weak = getWeakTopics(profile, 4)
  const due = options?.preferDue ? getDueTopics(profile) : []
  const focus = Array.from(new Set([...due, ...weak, ...topics]))

  const byTopic = new Map<TopicId, Task[]>()
  for (const task of allTasks) {
    if (!topics.includes(task.dzial)) continue
    const list = byTopic.get(task.dzial) ?? []
    list.push(task)
    byTopic.set(task.dzial, list)
  }

  const availableTopics = Array.from(byTopic.keys()).filter((t) => focus.includes(t) || topics.includes(t))
  if (availableTopics.length === 0) {
    return shuffle(allTasks.filter((task) => topics.includes(task.dzial))).slice(0, count)
  }

  const selected: Task[] = []
  const usedIds = new Set<string>()
  const topicSequence = pickWeightedTopics(profile, availableTopics, count)

  for (const topic of topicSequence) {
    const candidates = (byTopic.get(topic) ?? []).filter((t) => !usedIds.has(t.id))
    if (candidates.length === 0) continue
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    usedIds.add(pick.id)
    selected.push(pick)
  }

  if (selected.length < count) {
    const rest = shuffle(allTasks.filter((t) => !usedIds.has(t.id) && topics.includes(t.dzial)))
    for (const t of rest) {
      if (selected.length >= count) break
      selected.push(t)
    }
  }

  if (selected.length < count) {
    const rest = shuffle(allTasks.filter((task) => !usedIds.has(task.id)))
    for (const task of rest) {
      if (selected.length >= count) break
      selected.push(task)
    }
  }

  return interleave(selected)
}

function interleave(tasks: Task[]): Task[] {
  if (tasks.length <= 2) return tasks
  const byTopic = new Map<TopicId, Task[]>()
  for (const t of tasks) {
    const list = byTopic.get(t.dzial) ?? []
    list.push(t)
    byTopic.set(t.dzial, list)
  }

  const result: Task[] = []
  let last: TopicId | null = null

  while (result.length < tasks.length) {
    const keys = Array.from(byTopic.keys()).filter((k) => (byTopic.get(k)?.length ?? 0) > 0)
    if (keys.length === 0) break
    const preferred = keys.filter((k) => k !== last)
    const pool = preferred.length > 0 ? preferred : keys
    const topic = pool[Math.floor(Math.random() * pool.length)]
    result.push(byTopic.get(topic)!.shift()!)
    last = topic
  }

  return result
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function selectByTopic(allTasks: Task[], topic: TopicId, count = 8): Task[] {
  return shuffle(allTasks.filter((t) => t.dzial === topic)).slice(0, count)
}

export function selectExamSet(allTasks: Task[], count = 25): Task[] {
  const easy = shuffle(allTasks.filter((t) => t.trudnosc === 1))
  const mid = shuffle(allTasks.filter((t) => t.trudnosc === 2))
  const hard = shuffle(allTasks.filter((t) => t.trudnosc === 3))
  const nEasy = Math.round(count * 0.4)
  const nHard = Math.round(count * 0.2)
  const nMid = count - nEasy - nHard
  return interleave([...easy.slice(0, nEasy), ...mid.slice(0, nMid), ...hard.slice(0, nHard)]).slice(
    0,
    count,
  )
}

/** Wybiera co najmniej jedno zadanie z każdego działu, zanim zacznie uzupełniać zestaw. */
export function selectDiagnosticSet(allTasks: Task[], count = 12): Task[] {
  const byTopic = new Map<TopicId, Task[]>()
  for (const task of shuffle(allTasks)) {
    const tasks = byTopic.get(task.dzial) ?? []
    tasks.push(task)
    byTopic.set(task.dzial, tasks)
  }

  const selected: Task[] = []
  const usedIds = new Set<string>()
  const topics = shuffle(Array.from(byTopic.keys()))

  for (const topic of topics) {
    if (selected.length >= count) break
    const task = byTopic.get(topic)?.[0]
    if (task) {
      selected.push(task)
      usedIds.add(task.id)
    }
  }

  if (selected.length < count) {
    for (const task of shuffle(allTasks.filter((item) => !usedIds.has(item.id)))) {
      if (selected.length >= count) break
      selected.push(task)
    }
  }

  return interleave(selected)
}
