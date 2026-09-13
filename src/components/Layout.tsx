import { Link, NavLink } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext'

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-sky-50'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      <header className="sticky top-0 z-20 border-b border-sky-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-lg font-black text-white shadow">
              L
            </span>
            <div>
              <p className="text-lg font-black leading-tight text-slate-800">Trener Leon</p>
              <p className="text-xs text-slate-500">
                {profile.name} · klasa {profile.klasa}
              </p>
            </div>
          </Link>
          <nav className="flex flex-wrap gap-1">
            <NavLink to="/" end className={linkClass}>
              Start
            </NavLink>
            <NavLink to="/nauka" className={linkClass}>
              Nauka
            </NavLink>
            <NavLink to="/quiz" className={linkClass}>
              Quiz
            </NavLink>
            <NavLink to="/symulacja" className={linkClass}>
              Symulacja
            </NavLink>
            <NavLink to="/powtorki" className={linkClass}>
              Powtórki
            </NavLink>
            <NavLink to="/postepy" className={linkClass}>
              Postępy
            </NavLink>
            <NavLink to="/rodzic" className={linkClass}>
              Rodzic
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-2 py-6 sm:px-4">{children}</main>
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        Przygotowanie do konkursu Leon · materiały treningowe (parafrazy) · dane tylko lokalnie w
        przeglądarce
      </footer>
    </div>
  )
}
