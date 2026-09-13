import type { OptionKey } from '../types'

interface AnswerCardProps {
  total: number
  currentIndex: number
  answers: Record<number, OptionKey[]>
  onJump: (index: number) => void
}

export function AnswerCard({ total, currentIndex, answers, onJump }: AnswerCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-200">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        Karta odpowiedzi
      </h3>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {Array.from({ length: total }, (_, i) => {
          const filled = (answers[i]?.length ?? 0) > 0
          const active = i === currentIndex
          return (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              className={`flex h-11 min-w-11 flex-col items-center justify-center rounded-xl text-sm font-bold transition ${
                active
                  ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                  : filled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{i + 1}</span>
              {filled && (
                <span className="text-[10px] font-normal leading-none">{answers[i].join('')}</span>
              )}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Zielone = zaznaczone. Kliknij numer, by wrócić. Możesz zaznaczyć kilka liter (A–D).
      </p>
    </div>
  )
}
