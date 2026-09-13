import { useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { useProfile } from '../context/ProfileContext'
import { loadTasksForPool } from '../data'
import { selectAdaptiveTasks } from '../engine/adaptive'
import type { SessionRecord, Task } from '../types'

export function QuizPage() {
  const { profile, recordSession } = useProfile()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  const startQuiz = () => {
    setLoading(true)
    void loadTasksForPool(profile.klasa, 'quiz').then((pool) => {
      setTasks(selectAdaptiveTasks(pool, profile, 10, { preferDue: true }))
      setLoading(false)
    })
  }

  if (tasks.length > 0) {
    return (
      <QuizRunner
        tasks={tasks}
        mode="quiz"
        title="Szybki quiz"
        onCancel={() => setTasks([])}
        onComplete={({ score, maxScore, attempts, startedAt, durationSec }) => {
          const session: SessionRecord = {
            id: `quiz-${Date.now()}`,
            mode: 'quiz',
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
      <h1 className="text-3xl font-black text-slate-800">Szybki quiz</h1>
      <p className="text-slate-600">
        10 pytań z różnych działów. Silnik częściej losuje tematy, w których masz niższe wyniki.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={startQuiz}
        className="w-full rounded-2xl bg-sky-600 py-4 text-lg font-bold text-white shadow-lg hover:bg-sky-700 disabled:opacity-50"
      >
        {loading ? 'Ładowanie zadań…' : 'Start quizu'}
      </button>
    </div>
  )
}
