import { useMemo, useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { useProfile } from '../context/ProfileContext'
import { getTasksForGrade } from '../data'
import { selectDiagnosticSet } from '../engine/adaptive'
import type { SessionRecord } from '../types'

export function DiagnosePage() {
  const { profile, recordSession } = useProfile()
  const [running, setRunning] = useState(false)
  const tasks = useMemo(() => {
    if (!running) return []
    return selectDiagnosticSet(getTasksForGrade(profile.klasa), 12)
  }, [running, profile.klasa])

  if (running && tasks.length > 0) {
    return (
      <QuizRunner
        tasks={tasks}
        mode="diagnoza"
        title="Diagnoza startowa"
        showFeedbackImmediate
        onCancel={() => setRunning(false)}
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
        onClick={() => setRunning(true)}
        className="w-full rounded-2xl bg-sky-600 py-4 text-lg font-bold text-white shadow-lg"
      >
        Rozpocznij diagnozę
      </button>
    </div>
  )
}
