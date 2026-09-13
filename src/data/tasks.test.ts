import { describe, expect, it } from 'vitest'
import { ALL_TASKS, getTasksForGrade } from './index'
import { scoreTask } from '../engine/scoring'
import { selectDiagnosticSet } from '../engine/adaptive'

describe('spójność bazy zadań', () => {
  it('zadanie k3-w25-18 pozwala zaznaczyć oba malejące szeregi', () => {
    const task = ALL_TASKS.find(({ id }) => id === 'k3-w25-18')

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
    const sameResults = ALL_TASKS.find(({ id }) => id === 'k3-j24-08')
    const fourthGrade = ALL_TASKS.find(({ id }) => id === 'k4-w25-02')

    expect(sameResults?.poprawne).toEqual(['A', 'C', 'D'])
    expect(fourthGrade?.typ).toBe('multi')
    expect(fourthGrade?.poprawne).toEqual(['A', 'B', 'C', 'D'])
  })

  it('typ zadania zgadza się z liczbą poprawnych odpowiedzi', () => {
    for (const task of ALL_TASKS) {
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
    for (const task of ALL_TASKS) {
      for (const key of task.poprawne) {
        expect(task.opcje[key], `${task.id}: brak opcji ${key}`).toBeDefined()
      }
    }
  })

  it('opcje w jednym zadaniu nie powtarzają się', () => {
    for (const task of ALL_TASKS) {
      const values = Object.values(task.opcje)
      expect(new Set(values).size, task.id).toBe(values.length)
    }
  })

  it('diagnoza obejmuje wszystkie dostępne działy', () => {
    const availableTopics = new Set(ALL_TASKS.map(({ dzial }) => dzial))
    const diagnosticTopics = new Set(
      selectDiagnosticSet(ALL_TASKS, availableTopics.size).map(({ dzial }) => dzial),
    )

    expect(diagnosticTopics).toEqual(availableTopics)
  })

  it('zawiera pełną i zrównoważoną bazę klasy 1', () => {
    const tasks = getTasksForGrade(1)
    const expectedTopics = [
      'liczby-ciagi',
      'dodawanie-odejmowanie',
      'zadania-tekstowe',
      'czas-miary',
      'geometria',
      'logika',
    ]

    expect(tasks).toHaveLength(95)
    expect(new Set(tasks.map(({ id }) => id)).size).toBe(95)

    for (const topic of expectedTopics) {
      expect(tasks.filter(({ dzial }) => dzial === topic).length, topic).toBeGreaterThanOrEqual(10)
    }

    for (const task of tasks) {
      expect(Object.keys(task.opcje), task.id).toHaveLength(4)
      expect(task.klasa, task.id).toBe(1)
      if (task.typ === 'multi') {
        expect(task.poprawne.length, task.id).toBeGreaterThanOrEqual(2)
      }
    }
  })
})
