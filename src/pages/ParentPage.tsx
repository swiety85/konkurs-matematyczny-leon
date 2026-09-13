import { useRef, useState } from 'react'
import { GRADES } from '../data/meta'
import { useProfile } from '../context/ProfileContext'
import type { Grade } from '../types'

export function ParentPage() {
  const {
    profile,
    setNameAndGrade,
    doExport,
    doImport,
    doReset,
    addStudent,
    showStudentChooser,
  } = useProfile()
  const [name, setName] = useState(profile.name)
  const [klasa, setKlasa] = useState<Grade>(profile.klasa)
  const [newName, setNewName] = useState('')
  const [newGrade, setNewGrade] = useState<Grade>(3)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const save = () => {
    setNameAndGrade(name.trim() || 'Uczeń', klasa)
    setMessage('Zapisano profil.')
  }

  const download = () => {
    const blob = new Blob([doExport()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leon-profil-${profile.name}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Wyeksportowano profil.')
  }

  const onFile = async (file: File) => {
    try {
      const text = await file.text()
      doImport(text)
      setMessage('Zaimportowano profil.')
    } catch {
      setMessage('Błąd importu — sprawdź plik JSON.')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4">
      <h1 className="text-3xl font-black text-slate-800">Panel rodzica</h1>
      <p className="text-slate-600">
        Dane zapisywane są tylko lokalnie w przeglądarce (localStorage). Możesz je wyeksportować na
        inny komputer.
      </p>

      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <label className="block">
          <span className="text-sm font-semibold text-slate-600">Imię dziecka</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-600">Klasa</span>
          <select
            value={klasa}
            onChange={(e) => setKlasa(Number(e.target.value) as Grade)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg"
          >
            {GRADES.map((g) => (
              <option key={g.klasa} value={g.klasa} disabled={!g.dostepna && g.klasa !== klasa}>
                {g.nazwa}
                {!g.dostepna ? ' (wkrótce)' : ''}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={save}
          className="w-full rounded-2xl bg-sky-600 py-3 font-bold text-white"
        >
          Zapisz
        </button>
      </div>

      <div className="space-y-3 rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <h2 className="font-bold text-slate-800">Uczniowie</h2>
        {!showAddStudent ? (
          <>
            <button
              type="button"
              onClick={() => setShowAddStudent(true)}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white"
            >
              Dodaj nowego ucznia
            </button>
            <button
              type="button"
              onClick={showStudentChooser}
              className="w-full rounded-xl border border-slate-300 py-3 font-semibold text-slate-700"
            >
              Przełącz ucznia
            </button>
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-sm font-semibold text-slate-600">Imię nowego ucznia</span>
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-600">Klasa</span>
              <select
                value={newGrade}
                onChange={(event) => setNewGrade(Number(event.target.value) as Grade)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
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
              disabled={!newName.trim()}
              onClick={() => addStudent(newName.trim(), newGrade)}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white disabled:opacity-40"
            >
              Utwórz i przełącz
            </button>
            <button
              type="button"
              onClick={() => setShowAddStudent(false)}
              className="w-full py-2 font-semibold text-slate-500"
            >
              Anuluj
            </button>
          </>
        )}
      </div>

      <div className="space-y-3 rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <h2 className="font-bold text-slate-800">Kopia zapasowa</h2>
        <button
          type="button"
          onClick={download}
          className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white"
        >
          Eksportuj JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl bg-slate-700 py-3 font-semibold text-white"
        >
          Importuj JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (confirm('Na pewno wyczyścić wszystkie postępy?')) {
              doReset()
              setMessage('Zresetowano profil.')
            }
          }}
          className="w-full rounded-xl border border-red-200 py-3 font-semibold text-red-600"
        >
          Resetuj postępy
        </button>
      </div>

      {message && <p className="text-center text-sm font-medium text-emerald-700">{message}</p>}

      <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
        <p className="font-bold">Jak dodać zadania nowej klasy?</p>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>
            Utwórz plik <code className="rounded bg-white px-1">src/data/klasaN/tasks.ts</code>
          </li>
          <li>Dodaj zadania zgodne ze schematem Task (patrz README)</li>
          <li>
            Zaimportuj je w <code className="rounded bg-white px-1">src/data/index.ts</code>
          </li>
          <li>
            Ustaw <code className="rounded bg-white px-1">dostepna: true</code> w GRADES
          </li>
        </ol>
      </div>
    </div>
  )
}
