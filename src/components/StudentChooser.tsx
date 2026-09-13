import { useState } from 'react'
import { GRADES } from '../data/meta'
import type { StudentProfileRef } from '../engine/storage'
import type { Grade } from '../types'

interface StudentChooserProps {
  students: StudentProfileRef[]
  onSelect: (id: string) => void
  onCreate: (name: string, klasa: Grade) => void
}

export function StudentChooser({ students, onSelect, onCreate }: StudentChooserProps) {
  const [showForm, setShowForm] = useState(students.length === 0)
  const [name, setName] = useState('')
  const [klasa, setKlasa] = useState<Grade>(3)

  const create = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    onCreate(trimmedName, klasa)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-sky-600">Trener Leon</p>
        <h1 className="mt-2 text-3xl font-black text-slate-800">
          {students.length === 0 ? 'Utwórz profil dziecka' : 'Kto dziś ćwiczy?'}
        </h1>

        {!showForm && (
          <div className="mt-6 space-y-3">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => onSelect(student.id)}
                className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-200 px-5 py-4 text-left transition hover:border-sky-400 hover:bg-sky-50"
              >
                <span className="text-lg font-bold text-slate-800">{student.name}</span>
                <span className="text-sm text-slate-500">Klasa {student.klasa}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full rounded-2xl bg-sky-600 py-3 font-bold text-white hover:bg-sky-700"
            >
              + Dodaj nowego ucznia
            </button>
          </div>
        )}

        {showForm && (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-600">Imię dziecka</span>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') create()
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-600">Klasa</span>
              <select
                value={klasa}
                onChange={(event) => setKlasa(Number(event.target.value) as Grade)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg"
              >
                {GRADES.filter(({ dostepna }) => dostepna).map((grade) => (
                  <option key={grade.klasa} value={grade.klasa}>
                    {grade.nazwa}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!name.trim()}
              onClick={create}
              className="w-full rounded-2xl bg-sky-600 py-3 font-bold text-white disabled:opacity-40"
            >
              Utwórz profil i rozpocznij
            </button>
            {students.length > 0 && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-full py-2 font-semibold text-slate-500"
              >
                Wróć do listy uczniów
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
