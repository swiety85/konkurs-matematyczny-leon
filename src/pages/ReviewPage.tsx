import { useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { useProfile } from '../context/ProfileContext'
import { getTasksForGrade } from '../data'
import { TOPICS } from '../data/meta'
import { selectAdaptiveTasks } from '../engine/adaptive'
import { getDueTopics, getWeakTopics } from '../engine/storage'
import type { SessionRecord, Task } from '../types'

export function ReviewPage() {
  const { profile, recordSession } = useProfile()
  const [tasks, setTasks] = useState<Task[]>([])
  const weak = getWeakTopics(profile, 5)
  const due = getDueTopics(profile)

  const startReview = () => {
    const focus = Array.from(new Set([...due, ...weak]))
    setTasks(
      selectAdaptiveTasks(getTasksForGrade(profile.klasa), profile, 12, {
        topics: focus.length ? focus : undefined,
        preferDue: true,
      }),
    )
  }

  if (tasks.length > 0) {
    return (
      <QuizRunner
        tasks={tasks}
        mode="powtorki"
        title="Powtórki adaptacyjne"
        showFeedbackImmediate
        onCancel={() => setTasks([])}
        onComplete={({ score, maxScore, attempts, startedAt, durationSec }) => {
          const session: SessionRecord = {
            id: `pow-${Date.now()}`,
            mode: 'powtorki',
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
      <h1 className="text-center text-3xl font-black text-slate-800">Powtórki</h1>
      <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <h2 className="font-bold text-slate-800">Zaplanowane (spaced repetition)</h2>
        {due.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Brak zaległych powtórek — świetnie!</p>
        ) : (
          <ul className="mt-2 list-inside list-disc text-slate-700">
            {due.map((t) => (
              <li key={t}>{TOPICS[t].nazwa}</li>
            ))}
          </ul>
        )}
        <h2 className="mt-6 font-bold text-slate-800">Słabe działy</h2>
        {weak.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Za mało danych — zrób najpierw diagnozę lub quiz.
          </p>
        ) : (
          <ul className="mt-2 list-inside list-disc text-slate-700">
            {weak.map((t) => (
              <li key={t}>
                {TOPICS[t].nazwa} ({Math.round((profile.topicStats[t]?.mastery ?? 0) * 100)}%)
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={startReview}
          className="mt-6 w-full rounded-2xl bg-amber-500 py-4 text-lg font-bold text-white shadow-lg hover:bg-amber-600"
        >
          Ćwicz słabe tematy
        </button>
      </div>
    </div>
  )
}
