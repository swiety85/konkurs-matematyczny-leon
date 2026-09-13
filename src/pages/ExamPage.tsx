import { useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { useProfile } from '../context/ProfileContext'
import { loadTasksForPool } from '../data'
import { selectExamSet } from '../engine/adaptive'
import type { SessionRecord, Task } from '../types'

const EXAM_SECONDS = 45 * 60

export function ExamPage() {
  const { profile, recordSession } = useProfile()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  const startExam = () => {
    setLoading(true)
    void loadTasksForPool(profile.klasa, 'exam').then((pool) => {
      setTasks(selectExamSet(pool, 25))
      setLoading(false)
    })
  }

  if (tasks.length > 0) {
    return (
      <QuizRunner
        tasks={tasks}
        mode="symulacja"
        title="Symulacja konkursu Leon"
        timedSec={EXAM_SECONDS}
        onCancel={() => setTasks([])}
        onComplete={({ score, maxScore, attempts, startedAt, durationSec }) => {
          const session: SessionRecord = {
            id: `sym-${Date.now()}`,
            mode: 'symulacja',
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
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="text-center text-3xl font-black text-slate-800">Symulacja 45 minut</h1>
      <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <ul className="list-inside list-disc space-y-2 text-slate-700">
          <li>25 zadań w stylu arkusza Leon</li>
          <li>Timer 45 minut (jak na konkursie)</li>
          <li>Możesz zaznaczyć kilka odpowiedzi lub żadną</li>
          <li>Karta odpowiedzi jak w klasach I–III</li>
          <li>Wynik i wyjaśnienia dopiero na końcu</li>
        </ul>
        <button
          type="button"
          disabled={loading}
          onClick={startExam}
          className="mt-6 w-full rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Ładowanie arkusza…' : 'Rozpocznij symulację'}
        </button>
      </div>
    </div>
  )
}
