import type { OptionKey, Task } from '../types'

/**
 * Punktacja zgodna z regulaminem konkursu Leon:
 * - za każdą zaznaczoną poprawną odpowiedź: +1 pkt
 * - jeśli zaznaczono choć jedną błędną: 0 pkt za całe zadanie
 * - gdy żadna opcja nie jest poprawna: 1 pkt za puste zaznaczenie, 0 jeśli coś zaznaczono
 */
export function scoreTask(
  task: Task,
  selected: OptionKey[],
  openText = '',
): { points: number; maxPoints: number; correct: boolean } {
  if (task.typ === 'open') {
    const maxPoints = 1
    if (!task.openAnswer) return { points: 0, maxPoints, correct: false }
    const correct = normalizeOpen(task.openAnswer) === normalizeOpen(openText)
    return { points: correct ? 1 : 0, maxPoints, correct }
  }

  const correctSet = new Set(task.poprawne)
  const maxPoints = correctSet.size === 0 ? 1 : correctSet.size

  if (correctSet.size === 0) {
    const points = selected.length === 0 ? 1 : 0
    return { points, maxPoints, correct: points === maxPoints }
  }

  const hasWrong = selected.some((s) => !correctSet.has(s))
  if (hasWrong) return { points: 0, maxPoints, correct: false }

  const points = selected.filter((s) => correctSet.has(s)).length
  return {
    points,
    maxPoints,
    correct: points === maxPoints && selected.length === correctSet.size,
  }
}

function normalizeOpen(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(',', '.')
}

export function maxScoreForTasks(tasks: Task[]): number {
  return tasks.reduce((sum, t) => {
    if (t.typ === 'open') return sum + 1
    if (t.poprawne.length === 0) return sum + 1
    return sum + t.poprawne.length
  }, 0)
}
