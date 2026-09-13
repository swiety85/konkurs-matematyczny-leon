import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStudent, loadProfile, loadStudents, saveProfile } from './storage'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('profile uczniów', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('rozdziela dane uczniów o tym samym imieniu', () => {
    const first = createStudent('Ola', 3)
    const second = createStudent('Ola', 3)

    expect(first.student.id).not.toBe(second.student.id)
    expect(loadStudents()).toHaveLength(2)

    saveProfile(first.student.id, { ...first.profile, totalStudySec: 120 })

    expect(loadProfile(first.student.id)?.totalStudySec).toBe(120)
    expect(loadProfile(second.student.id)?.totalStudySec).toBe(0)
  })
})
