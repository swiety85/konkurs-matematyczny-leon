import { Link } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext'
import { TOPICS } from '../data/meta'
import { getDueTopics, getWeakTopics, MASTERY_THRESHOLD } from '../engine/storage'

export function HomePage() {
  const { profile } = useProfile()
  const weak = getWeakTopics(profile, 3)
  const due = getDueTopics(profile)

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 p-8 text-white shadow-xl sm:p-12">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-100">
            Konkurs matematyczny Leon
          </p>
          <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
            Cześć, {profile.name}! 🦁
          </h1>
          <p className="mt-4 text-lg text-sky-50">
            Trenuj jak na prawdziwym konkursie: pytania z wieloma odpowiedziami, timer 45 minut i
            automatyczne powtórki słabych tematów.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/diagnoza"
              className="rounded-2xl bg-white px-5 py-3 font-bold text-sky-700 shadow hover:bg-sky-50"
            >
              Szybka diagnoza
            </Link>
            <Link
              to="/symulacja"
              className="rounded-2xl bg-sky-900/40 px-5 py-3 font-bold ring-1 ring-white/40 hover:bg-sky-900/60"
            >
              Symulacja 45 min
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-6 -top-4 text-[9rem] opacity-20">➗</div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/nauka', title: 'Nauka', desc: 'Działy z teorią i przykładami', emoji: '📚' },
          { to: '/quiz', title: 'Szybki quiz', desc: '10 mieszanych pytań', emoji: '⚡' },
          { to: '/powtorki', title: 'Powtórki', desc: 'Słabe tematy + spaced repetition', emoji: '🔁' },
          { to: '/postepy', title: 'Postępy', desc: 'Biegłość w działach', emoji: '📈' },
        ].map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">{card.emoji}</div>
            <h2 className="mt-3 text-xl font-bold text-slate-800">{card.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{card.desc}</p>
          </Link>
        ))}
      </section>

      {(weak.length > 0 || due.length > 0) && (
        <section className="rounded-3xl bg-amber-50 p-6 ring-1 ring-amber-200">
          <h2 className="text-lg font-bold text-amber-900">Twój plan na dziś</h2>
          {due.length > 0 && (
            <p className="mt-2 text-amber-800">
              Do powtórki: {due.map((t) => TOPICS[t].nazwa).join(', ')}
            </p>
          )}
          {weak.length > 0 && (
            <p className="mt-1 text-amber-800">
              Najsłabsze działy:{' '}
              {weak
                .map((t) => {
                  const m = profile.topicStats[t]?.mastery ?? 0
                  return `${TOPICS[t].nazwa} (${Math.round(m * 100)}%)`
                })
                .join(', ')}
            </p>
          )}
          <Link
            to="/powtorki"
            className="mt-4 inline-block rounded-xl bg-amber-500 px-4 py-2 font-bold text-white"
          >
            Zacznij powtórki
          </Link>
          <p className="mt-2 text-xs text-amber-700">
            Próg biegłości: {Math.round(MASTERY_THRESHOLD * 100)}% — potem rzadsze powtórki (1 / 3 /
            7 dni).
          </p>
        </section>
      )}
    </div>
  )
}
