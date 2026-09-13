import type { OptionKey, Task } from '../types'
import { scoreTask } from '../engine/scoring'

const KEYS: OptionKey[] = ['A', 'B', 'C', 'D']

interface QuestionCardProps {
  task: Task
  index: number
  total: number
  selected: OptionKey[]
  onToggle: (key: OptionKey) => void
  openText?: string
  onOpenChange?: (value: string) => void
  showFeedback?: boolean
  disabled?: boolean
}

export function QuestionCard({
  task,
  index,
  total,
  selected,
  onToggle,
  openText = '',
  onOpenChange,
  showFeedback = false,
  disabled = false,
}: QuestionCardProps) {
  const feedbackScore = showFeedback ? scoreTask(task, selected, openText) : null
  const hint =
    task.typ === 'open'
      ? 'Wpisz odpowiedź.'
      : task.typ === 'multi' || task.typ === 'none'
        ? 'Może być kilka poprawnych odpowiedzi — albo żadna.'
        : 'Wybierz jedną odpowiedź.'

  return (
    <div className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-slate-200 sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800">
          Pytanie {index + 1} / {total}
        </span>
        <span className="text-xs text-slate-400">{hint}</span>
      </div>

      <p className="mb-6 whitespace-pre-line text-lg font-medium leading-relaxed text-slate-800 sm:text-xl">
        {task.tresc}
      </p>

      {task.typ === 'open' ? (
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-600">Twoja odpowiedź</span>
          <input
            type="text"
            value={openText}
            disabled={disabled}
            onChange={(event) => onOpenChange?.(event.target.value)}
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-4 text-lg outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:cursor-default"
          />
        </label>
      ) : (
        <div className="grid gap-3">
          {KEYS.map((key) => {
            const label = task.opcje[key]
            if (!label) return null
            const isOn = selected.includes(key)
            const isCorrect = task.poprawne.includes(key)
            let style = 'border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50'
            if (isOn && !showFeedback) style = 'border-sky-500 bg-sky-100 ring-2 ring-sky-200'
            if (showFeedback) {
              if (isCorrect) style = 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
              else if (isOn) style = 'border-red-400 bg-red-50 ring-2 ring-red-200'
            }

            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onToggle(key)}
                className={`flex min-h-14 items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base transition sm:text-lg ${style} disabled:cursor-default`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    isOn && !showFeedback
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-slate-700 shadow-sm'
                  }`}
                >
                  {showFeedback && isOn ? (isCorrect ? '✓' : '✗') : isOn ? 'X' : key}
                </span>
                <span className="pt-1">{label}</span>
              </button>
            )
          })}
        </div>
      )}

      {task.typ === 'none' && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Uwaga: czasem żadna odpowiedź nie jest poprawna — wtedy nic nie zaznaczaj (1 pkt).
        </p>
      )}

      {showFeedback && (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          <p className="font-bold">
            Wynik: {feedbackScore?.points}/{feedbackScore?.maxPoints} pkt
          </p>
          <p className="mt-1">{task.wyjasnienie}</p>
          <p className="mt-2 text-xs text-emerald-700">
            Poprawna odpowiedź:{' '}
            {task.typ === 'open'
              ? task.openAnswer
              : task.poprawne.length
                ? task.poprawne.join(', ')
                : '(żadna)'}
          </p>
        </div>
      )}
    </div>
  )
}
