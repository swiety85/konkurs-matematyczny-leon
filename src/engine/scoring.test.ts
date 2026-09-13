import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import { scoreTask } from './scoring'

const task: Task = {
  id: 'test',
  klasa: 3,
  dzial: 'liczby-ciagi',
  typ: 'multi',
  tresc: 'Test',
  opcje: { A: '1', B: '2', C: '3', D: '4' },
  poprawne: ['A', 'C'],
  wyjasnienie: 'Test',
  zrodlo: 'Test',
  trudnosc: 1,
}

describe('punktacja Leon', () => {
  it('przyznaje po punkcie za każdą poprawną odpowiedź', () => {
    expect(scoreTask(task, ['A'])).toEqual({
      points: 1,
      maxPoints: 2,
      correct: false,
    })
    expect(scoreTask(task, ['A', 'C'])).toEqual({
      points: 2,
      maxPoints: 2,
      correct: true,
    })
  })

  it('zeruje całe zadanie po zaznaczeniu błędnej odpowiedzi', () => {
    expect(scoreTask(task, ['A', 'B'])).toEqual({
      points: 0,
      maxPoints: 2,
      correct: false,
    })
  })

  it('przyznaje punkt za pozostawienie pustego zadania typu none', () => {
    const noneTask: Task = { ...task, typ: 'none', poprawne: [] }

    expect(scoreTask(noneTask, [])).toEqual({
      points: 1,
      maxPoints: 1,
      correct: true,
    })
    expect(scoreTask(noneTask, ['A'])).toEqual({
      points: 0,
      maxPoints: 1,
      correct: false,
    })
  })

  it('ocenia znormalizowaną odpowiedź otwartą', () => {
    const openTask: Task = {
      ...task,
      typ: 'open',
      poprawne: [],
      openAnswer: '3,5 kg',
    }

    expect(scoreTask(openTask, [], ' 3.5   kg ')).toEqual({
      points: 1,
      maxPoints: 1,
      correct: true,
    })
  })
})
