import { useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { useProfile } from '../context/ProfileContext'
import { loadTasksForPool } from '../data'
import { selectDiagnosticSet } from '../engine/adaptive'
import type { SessionRecord, Task } from '../types'

export function DiagnosePage() {
  const { profile, recordSession } = useProfile()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  const startDiagnosis = () => {
    setLoading(true)
    void loadTasksForPool(profile.klasa, 'quiz').then((pool) => {
      setTasks(selectDiagnosticSet(pool, 12))
      setLoading(false)
    })
  }

  if (tasks.length > 0) {
    return (
      <QuizRunner
        tasks={tasks}
        mode="diagnoza"
        title="Diagnoza startowa"
        showFeedbackImmediate
        onCancel={() => setTasks([])}
        onComplete={({ score, maxScore, attempts, startedAt, durationSec }) => {
          const session: SessionRecord = {
            id: `diag-${Date.now()}`,
            mode: 'diagnoza',
            klasa: profile.klasa,
            startedAt,
            finishedAt: Date.now(),
            durationSec,
            score,
            maxScore,
            attempts,
          }
          recordSession(session)
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 text-center">
      <h1 className="text-3xl font-black text-slate-800">Szybka diagnoza</h1>
      <p className="text-slate-600">
        12 mieszanych zadań z różnych działów. Po teście aplikacja będzie wiedziała, na czym skupić
        powtórki.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={startDiagnosis}
        className="w-full rounded-2xl bg-sky-600 py-4 text-lg font-bold text-white shadow-lg disabled:opacity-50"
      >
        {loading ? 'Ładowanie zadań…' : 'Rozpocznij diagnozę'}
      </button>
    </div>
  )
}
