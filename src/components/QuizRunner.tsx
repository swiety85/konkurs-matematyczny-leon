import { useCallback, useMemo, useState } from 'react'
import type { AttemptRecord, OptionKey, SessionMode, Task } from '../types'
import { scoreTask } from '../engine/scoring'
import { useProfile } from '../context/ProfileContext'
import { AnswerCard } from './AnswerCard'
import { QuestionCard } from './QuestionCard'
import { Timer } from './Timer'

interface QuizRunnerProps {
  tasks: Task[]
  mode: SessionMode
  title: string
  timedSec?: number
  showFeedbackImmediate?: boolean
  onComplete: (result: {
    score: number
    maxScore: number
    attempts: AttemptRecord[]
    startedAt: number
    durationSec: number
  }) => void
  onCancel: () => void
}

export function QuizRunner({
  tasks,
  mode,
  title,
  timedSec,
  showFeedbackImmediate = false,
  onComplete,
  onCancel,
}: QuizRunnerProps) {
  const { profile } = useProfile()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, OptionKey[]>>({})
  const [openAnswers, setOpenAnswers] = useState<Record<number, string>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [startedAt] = useState(() => Date.now())
  const [running, setRunning] = useState(true)
  const [finished, setFinished] = useState(false)

  const task = tasks[index]

  const toggle = useCallback(
    (key: OptionKey) => {
      if (finished || revealed[index] || !task) return
      setAnswers((prev) => {
        const cur = prev[index] ?? []
        if (task.typ === 'single') {
          return { ...prev, [index]: cur.includes(key) ? [] : [key] }
        }
        return {
          ...prev,
          [index]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
        }
      })
    },
    [finished, revealed, index, task],
  )

  const finish = useCallback(() => {
    if (finished) return
    setRunning(false)
    setFinished(true)
    const attempts: AttemptRecord[] = tasks.map((t, i) => {
      const selected = answers[i] ?? []
      const openText = openAnswers[i] ?? ''
      const { points, maxPoints, correct } = scoreTask(t, selected, openText)
      return {
        taskId: t.id,
        dzial: t.dzial,
        selected,
        openText: t.typ === 'open' ? openText : undefined,
        correct,
        points,
        maxPoints,
        timestamp: Date.now(),
      }
    })
    onComplete({
      score: attempts.reduce((s, a) => s + a.points, 0),
      maxScore: attempts.reduce((s, a) => s + a.maxPoints, 0),
      attempts,
      startedAt,
      durationSec: Math.round((Date.now() - startedAt) / 1000),
    })
  }, [finished, tasks, answers, openAnswers, startedAt, onComplete])

  const review = useMemo(() => {
    if (!finished) return null
    return tasks.map((t, i) => {
      const selected = answers[i] ?? []
      const openText = openAnswers[i] ?? ''
      return { task: t, selected, openText, ...scoreTask(t, selected, openText) }
    })
  }, [finished, tasks, answers, openAnswers])

  if (!task) {
    return (
      <div className="p-8 text-center">
        <p>Brak zadań w tym zestawie.</p>
        <button type="button" onClick={onCancel} className="mt-4 text-sky-600 underline">
          Wróć
        </button>
      </div>
    )
  }

  if (finished && review) {
    const score = review.reduce((s, x) => s + x.points, 0)
    const maxScore = review.reduce((s, x) => s + x.maxPoints, 0)
    const pct = maxScore ? Math.round((score / maxScore) * 100) : 0
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 p-8 text-white shadow-xl">
          <p className="text-sm opacity-90">Koniec — {title}</p>
          <h2 className="mt-2 text-4xl font-black">
            {score} / {maxScore} pkt
          </h2>
          <p className="mt-2 text-xl">
            {pct}% · Super, {profile.name}!
          </p>
        </div>
        <div className="space-y-4">
          {review.map((item, i) => (
            <div
              key={item.task.id}
              className={`rounded-2xl border-2 p-4 ${
                item.correct ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
              }`}
            >
              <p className="font-bold">
                {i + 1}. {item.correct ? '✓' : '✗'} ({item.points}/{item.maxPoints} pkt)
              </p>
              <p className="mt-1 whitespace-pre-line text-sm">{item.task.tresc}</p>
              <p className="mt-2 text-sm">
                Twoja:{' '}
                <strong>
                  {item.task.typ === 'open'
                    ? item.openText || '(pusto)'
                    : item.selected.length
                      ? item.selected.join(', ')
                      : '(pusto)'}
                </strong>
                {' · '}Poprawne:{' '}
                <strong>
                  {item.task.typ === 'open'
                    ? item.task.openAnswer
                    : item.task.poprawne.length
                      ? item.task.poprawne.join(', ')
                      : '(żadna)'}
                </strong>
              </p>
              <p className="mt-1 text-sm text-slate-600">{item.task.wyjasnienie}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-2xl bg-sky-600 py-4 text-lg font-bold text-white shadow-lg hover:bg-sky-700"
        >
          Wróć do menu
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">{title}</h1>
          <p className="text-sm text-slate-500">
            Tryb: {mode} · {tasks.length} pytań
          </p>
        </div>
        {timedSec != null && <Timer seconds={timedSec} running={running} onExpire={finish} />}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <QuestionCard
            task={task}
            index={index}
            total={tasks.length}
            selected={answers[index] ?? []}
            onToggle={toggle}
            openText={openAnswers[index] ?? ''}
            onOpenChange={(value) =>
              setOpenAnswers((current) => ({ ...current, [index]: value }))
            }
            showFeedback={!!revealed[index]}
            disabled={!!revealed[index]}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="rounded-xl bg-slate-200 px-5 py-3 font-semibold disabled:opacity-40"
            >
              ← Poprzednie
            </button>

            {showFeedbackImmediate && !revealed[index] && (
              <button
                type="button"
                onClick={() => setRevealed((r) => ({ ...r, [index]: true }))}
                className="rounded-xl bg-amber-400 px-5 py-3 font-semibold text-amber-950"
              >
                Sprawdź
              </button>
            )}

            {index < tasks.length - 1 ? (
              <button
                type="button"
                disabled={showFeedbackImmediate && !revealed[index]}
                onClick={() => setIndex((i) => Math.min(tasks.length - 1, i + 1))}
                className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Następne →
              </button>
            ) : (
              <button
                type="button"
                disabled={showFeedbackImmediate && !revealed[index]}
                onClick={finish}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Zakończ
              </button>
            )}

            <button
              type="button"
              onClick={onCancel}
              className="ml-auto rounded-xl px-4 py-3 text-slate-500 hover:bg-slate-100"
            >
              Anuluj
            </button>
          </div>
        </div>

        <AnswerCard
          total={tasks.length}
          currentIndex={index}
          answers={answers}
          onJump={setIndex}
        />
      </div>
    </div>
  )
}
