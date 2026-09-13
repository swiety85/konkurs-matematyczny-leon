import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QuizRunner } from '../components/QuizRunner'
import { useProfile } from '../context/ProfileContext'
import { getTasksByTopic } from '../data'
import { GRADES, TOPICS } from '../data/meta'
import { selectByTopic } from '../engine/adaptive'
import type { SessionRecord, TopicId } from '../types'

export function LearnPage() {
  const { profile, recordSession } = useProfile()
  const gradeMeta = GRADES.find((g) => g.klasa === profile.klasa) ?? GRADES[2]
  const [topic, setTopic] = useState<TopicId | null>(null)
  const [running, setRunning] = useState(false)

  const tasks = useMemo(() => {
    if (!topic || !running) return []
    return selectByTopic(getTasksByTopic(profile.klasa, topic), topic, 8)
  }, [topic, profile.klasa, running])

  if (running && topic && tasks.length > 0) {
    return (
      <QuizRunner
        tasks={tasks}
        mode="nauka"
        title={`Nauka: ${TOPICS[topic].nazwa}`}
        showFeedbackImmediate
        onCancel={() => setRunning(false)}
        onComplete={({ score, maxScore, attempts, startedAt, durationSec }) => {
          const session: SessionRecord = {
            id: `nauka-${Date.now()}`,
            mode: 'nauka',
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

  if (topic) {
    const meta = TOPICS[topic]
    const gradeContent = meta.gradeContent?.[profile.klasa]
    const available = getTasksByTopic(profile.klasa, topic).length
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <button type="button" onClick={() => setTopic(null)} className="text-sky-600 hover:underline">
          ← Wszystkie działy
        </button>
        <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
          <h1 className="text-3xl font-black text-slate-800">{meta.nazwa}</h1>
          <p className="mt-2 text-slate-600">{meta.opis}</p>
          <div className="mt-6 rounded-2xl bg-sky-50 p-4">
            <h2 className="font-bold text-sky-900">Teoria</h2>
            <p className="mt-2 text-sky-900">{gradeContent?.teoria ?? meta.teoria}</p>
          </div>
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
            <h2 className="font-bold text-emerald-900">Przykład</h2>
            <p className="mt-2 text-emerald-900">{gradeContent?.przyklad ?? meta.przyklad}</p>
          </div>
          <p className="mt-4 text-sm text-slate-500">Dostępnych zadań: {available}</p>
          <button
            type="button"
            disabled={available === 0}
            onClick={() => setRunning(true)}
            className="mt-4 w-full rounded-2xl bg-sky-600 py-4 text-lg font-bold text-white disabled:opacity-40"
          >
            Ćwicz ten dział (8 zadań)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Nauka po działach</h1>
        <p className="text-slate-600">
          {gradeMeta.nazwa}: {gradeMeta.opis}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {gradeMeta.dzialy.map((id) => {
          const t = TOPICS[id]
          const stats = profile.topicStats[id]
          const mastery = Math.round((stats?.mastery ?? 0) * 100)
          const count = getTasksByTopic(profile.klasa, id).length
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTopic(id)}
              className="rounded-3xl bg-white p-5 text-left shadow-md ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <h2 className="text-lg font-bold text-slate-800">{t.nazwa}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.opis}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${mastery}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Biegłość {mastery}% · {count} zadań
              </p>
            </button>
          )
        })}
      </div>
      {!gradeMeta.dostepna && (
        <p className="rounded-2xl bg-slate-100 p-4 text-slate-600">
          Ta klasa jest w szkielecie — pełna baza zadań jest dla klasy 3 (+ mostek 4).{' '}
          <Link to="/rodzic" className="text-sky-600 underline">
            Zmień klasę
          </Link>
        </p>
      )}
    </div>
  )
}
