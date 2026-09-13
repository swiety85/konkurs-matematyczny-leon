import { TOPICS } from '../data/meta'
import { useProfile } from '../context/ProfileContext'
import { MASTERY_THRESHOLD } from '../engine/storage'
import type { TopicId, TopicStats } from '../types'

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h} h ${m % 60} min`
  }
  return `${m} min ${sec % 60} s`
}

export function ProgressPage() {
  const { profile } = useProfile()
  const entries = (Object.entries(profile.topicStats) as [TopicId, TopicStats][])
    .filter(([, s]) => s.attempts > 0)
    .sort((a, b) => b[1].mastery - a[1].mastery)

  const recent = profile.sessions.slice(0, 8)

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Postępy</h1>
        <p className="text-slate-600">
          Czas nauki: {formatDuration(profile.totalStudySec)} · Sesje: {profile.sessions.length}
        </p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Odznaki</h2>
        {profile.badges.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Jeszcze brak odznak — ćwicz dalej!</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {profile.badges.map((b) => (
              <div key={b.id} className="rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                <p className="font-bold text-amber-900">🏅 {b.nazwa}</p>
                <p className="text-xs text-amber-700">{b.opis}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Biegłość działów</h2>
        <p className="text-xs text-slate-500">
          Próg biegłości: {Math.round(MASTERY_THRESHOLD * 100)}%
        </p>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Brak danych — rozwiąż quiz lub diagnozę.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {entries.map(([id, stats]) => {
              const pct = Math.round(stats.mastery * 100)
              return (
                <div key={id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">{TOPICS[id]?.nazwa ?? id}</span>
                    <span className="text-slate-500">
                      {pct}% punktów · {stats.correct}/{stats.attempts} pełnych odpowiedzi
                    </span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Ostatnie sesje</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Brak sesji.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {recent.map((s) => (
              <li key={s.id} className="flex justify-between py-3 text-sm">
                <span className="font-medium text-slate-700">
                  {s.mode} · {new Date(s.finishedAt).toLocaleString('pl-PL')}
                </span>
                <span className="text-slate-500">
                  {s.score}/{s.maxScore} · {Math.round(s.durationSec / 60)} min
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
