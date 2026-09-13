import { describe, expect, it } from 'vitest'
import {
  LEGACY_TASKS,
  getTaskFingerprint,
  loadTasksForGrade,
  loadTasksForPool,
  poolOf,
} from './index'
import { klasa1Generated } from './generated/klasa1'
import { klasa2Generated } from './generated/klasa2'
import { klasa3Generated } from './generated/klasa3'
import { klasa4Generated } from './generated/klasa4'
import { scoreTask } from '../engine/scoring'
import { selectDiagnosticSet, selectExamSet } from '../engine/adaptive'
import type { GeneratedTask } from '../domain/taskSeed'

const GENERATED: GeneratedTask[] = [
  ...klasa1Generated,
  ...klasa2Generated,
  ...klasa3Generated,
  ...klasa4Generated,
]
const ALL = [...LEGACY_TASKS, ...GENERATED]

describe('spójność bazy zadań', () => {
  it('zadanie k3-w25-18 pozwala zaznaczyć oba malejące szeregi', () => {
    const task = LEGACY_TASKS.find(({ id }) => id === 'k3-w25-18')

    expect(task).toBeDefined()
    expect(task?.typ).toBe('multi')
    expect(task?.poprawne).toEqual(['C', 'D'])
    expect(scoreTask(task!, ['C', 'D'])).toEqual({
      points: 2,
      maxPoints: 2,
      correct: true,
    })
  })

  it('zawiera poprawione komplety odpowiedzi w innych wykrytych zadaniach', () => {
    const sameResults = LEGACY_TASKS.find(({ id }) => id === 'k3-j24-08')
    const fourthGrade = LEGACY_TASKS.find(({ id }) => id === 'k4-w25-02')

    expect(sameResults?.poprawne).toEqual(['A', 'C', 'D'])
    expect(fourthGrade?.typ).toBe('multi')
    expect(fourthGrade?.poprawne).toEqual(['A', 'B', 'C', 'D'])
  })

  it('zachowuje bazę legacy bez utraty identyfikatorów', () => {
    expect(LEGACY_TASKS).toHaveLength(417)
    expect(LEGACY_TASKS.filter(({ klasa }) => klasa === 1)).toHaveLength(95)
    expect(LEGACY_TASKS.filter(({ klasa }) => klasa === 2)).toHaveLength(100)
    expect(LEGACY_TASKS.filter(({ klasa }) => klasa === 3)).toHaveLength(112)
    expect(LEGACY_TASKS.filter(({ klasa }) => klasa === 4)).toHaveLength(110)
    expect(new Set(LEGACY_TASKS.map(({ id }) => id)).size).toBe(417)
  })

  it('typ zadania zgadza się z liczbą poprawnych odpowiedzi', () => {
    for (const task of ALL) {
      if (task.typ === 'single') {
        expect(task.poprawne, task.id).toHaveLength(1)
      }
      if (task.typ === 'multi') {
        expect(task.poprawne.length, task.id).toBeGreaterThan(0)
      }
      if (task.typ === 'none') {
        expect(task.poprawne, task.id).toHaveLength(0)
      }
      if (task.poprawne.length > 1) {
        expect(task.typ, task.id).toBe('multi')
      }
    }
  })

  it('każda poprawna odpowiedź istnieje w opcjach', () => {
    for (const task of ALL) {
      for (const key of task.poprawne) {
        expect(task.opcje[key], `${task.id}: brak opcji ${key}`).toBeDefined()
      }
    }
  })

  it('opcje w jednym zadaniu nie powtarzają się', () => {
    for (const task of ALL) {
      const values = Object.values(task.opcje)
      expect(new Set(values).size, task.id).toBe(values.length)
    }
  })

  it('legacy należy do puli nauki', () => {
    for (const task of LEGACY_TASKS) {
      expect(poolOf(task), task.id).toBe('learn')
    }
  })

  it('nie miesza pełnej bazy klasy 4 z mostkiem klasy 3', async () => {
    const thirdGradeTasks = await loadTasksForGrade(3)
    expect(thirdGradeTasks.some(({ id }) => id.startsWith('k4-w25-'))).toBe(true)
    expect(thirdGradeTasks.some(({ id }) => id.startsWith('k4-a-'))).toBe(false)
    expect(thirdGradeTasks.some(({ id }) => id.startsWith('k4-e-'))).toBe(false)
    expect(thirdGradeTasks.some(({ id }) => id.startsWith('k4-q-'))).toBe(false)
  })

  it.each([1, 2, 3, 4] as const)(
    'klasa %s ma ponad 100 zadań w każdej z trzech pul',
    async (grade) => {
      const learn = await loadTasksForPool(grade, 'learn')
      const quiz = await loadTasksForPool(grade, 'quiz')
      const exam = await loadTasksForPool(grade, 'exam')

      expect(learn.length).toBeGreaterThan(100)
      expect(quiz.length).toBeGreaterThan(100)
      expect(exam.length).toBeGreaterThan(100)
      expect(selectExamSet(exam, 25)).toHaveLength(25)

      const fingerprints = (tasks: typeof learn) => new Set(tasks.map(getTaskFingerprint))
      const learnFingerprints = fingerprints(learn)
      const quizFingerprints = fingerprints(quiz)
      const examFingerprints = fingerprints(exam)

      expect([...learnFingerprints].some((item) => quizFingerprints.has(item))).toBe(false)
      expect([...learnFingerprints].some((item) => examFingerprints.has(item))).toBe(false)
      expect([...quizFingerprints].some((item) => examFingerprints.has(item))).toBe(false)
    },
  )

  it('diagnoza z puli quizu obejmuje wszystkie działy klasy', async () => {
    for (const grade of [1, 2, 3, 4] as const) {
      const quiz = await loadTasksForPool(grade, 'quiz')
      const availableTopics = new Set(quiz.map(({ dzial }) => dzial))
      const diagnosticTopics = new Set(
        selectDiagnosticSet(quiz, availableTopics.size).map(({ dzial }) => dzial),
      )
      expect(diagnosticTopics).toEqual(availableTopics)
    }
  })
})
