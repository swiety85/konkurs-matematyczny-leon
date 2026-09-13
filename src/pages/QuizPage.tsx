import { useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { useProfile } from '../context/ProfileContext'
import { getTasksForPool } from '../data'
import { selectAdaptiveTasks } from '../engine/adaptive'
import type { SessionRecord, Task } from '../types'

export function QuizPage() {
  const { profile, recordSession } = useProfile()
  const [tasks, setTasks] = useState<Task[]>([])

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
        onClick={() =>
          setTasks(
            selectAdaptiveTasks(getTasksForPool(profile.klasa, 'quiz'), profile, 10, {
              preferDue: true,
            }),
          )
        }
        className="w-full rounded-2xl bg-sky-600 py-4 text-lg font-bold text-white shadow-lg hover:bg-sky-700"
      >
        Start quizu
      </button>
    </div>
  )
}
