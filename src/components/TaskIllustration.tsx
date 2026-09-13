import type { IllustrationSpec } from '../types'

function Clock({ hour, minute, label }: { hour: number; minute: number; label?: string }) {
  const hAngle = ((hour % 12) + minute / 60) * 30
  const mAngle = minute * 6
  return (
    <figure className="mx-auto w-fit rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={label ?? 'Zegar'}>
        <circle cx="70" cy="70" r="62" fill="white" stroke="#0ea5e9" strokeWidth="4" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180
          const x1 = 70 + 52 * Math.sin(a)
          const y1 = 70 - 52 * Math.cos(a)
          const x2 = 70 + 58 * Math.sin(a)
          const y2 = 70 - 58 * Math.cos(a)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="3" />
        })}
        <line
          x1="70"
          y1="70"
          x2={70 + 34 * Math.sin((hAngle * Math.PI) / 180)}
          y2={70 - 34 * Math.cos((hAngle * Math.PI) / 180)}
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line
          x1="70"
          y1="70"
          x2={70 + 48 * Math.sin((mAngle * Math.PI) / 180)}
          y2={70 - 48 * Math.cos((mAngle * Math.PI) / 180)}
          stroke="#0284c7"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="70" cy="70" r="5" fill="#0f172a" />
      </svg>
      {label && <figcaption className="mt-2 text-center text-sm text-slate-500">{label}</figcaption>}
    </figure>
  )
}

function Shapes({ shapes, highlight }: { shapes: string[]; highlight?: string }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      {shapes.map((shape) => {
        const hot = highlight === shape
        const cls = `flex h-16 w-16 items-center justify-center rounded-xl bg-white text-2xl ring-2 ${
          hot ? 'ring-sky-500' : 'ring-slate-200'
        }`
        const glyph =
          shape === 'koło' ? '●' : shape === 'trójkąt' ? '▲' : shape === 'kwadrat' ? '■' : '▬'
        return (
          <span key={shape} className={cls} title={shape} role="img" aria-label={shape}>
            {glyph}
          </span>
        )
      })}
    </div>
  )
}

function Domino({ left, right }: { left: number; right: number }) {
  const pips = (n: number) => '●'.repeat(Math.min(n, 6)) || '○'
  return (
    <div className="mx-auto flex w-fit overflow-hidden rounded-2xl bg-white text-xl ring-2 ring-slate-300">
      <span className="border-r-2 border-slate-300 px-5 py-3">{pips(left)}</span>
      <span className="px-5 py-3">{pips(right)}</span>
    </div>
  )
}

function NumberLine({ from, to, marks }: { from: number; to: number; marks: number[] }) {
  const span = Math.max(1, to - from)
  return (
    <svg viewBox="0 0 320 60" className="w-full rounded-2xl bg-slate-50 ring-1 ring-slate-200" role="img" aria-label="Oś liczbowa">
      <line x1="10" y1="30" x2="310" y2="30" stroke="#334155" strokeWidth="3" />
      {marks.map((m) => {
        const x = 10 + ((m - from) / span) * 300
        return (
          <g key={m}>
            <line x1={x} y1="20" x2={x} y2="40" stroke="#0284c7" strokeWidth="3" />
            <text x={x} y={55} textAnchor="middle" fontSize="12" fill="#334155">
              {m}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Bars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values)
  return (
    <div className="space-y-2 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-20 truncate text-xs text-slate-600">{labels[i] ?? `#${i + 1}`}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-slate-200">
            <div className="h-full rounded bg-sky-500" style={{ width: `${(v / max) * 100}%` }} />
          </div>
          <span className="w-10 text-right text-xs font-bold text-slate-700">{v}</span>
        </div>
      ))}
    </div>
  )
}

function Grid({ rows, cols, filled }: { rows: number; cols: number; filled: number }) {
  return (
    <div
      className="mx-auto grid w-fit gap-1 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
      style={{ gridTemplateColumns: `repeat(${cols}, 1.5rem)` }}
    >
      {Array.from({ length: rows * cols }, (_, i) => (
        <span
          key={i}
          className={`h-6 w-6 rounded ${i < filled ? 'bg-sky-500' : 'bg-white ring-1 ring-slate-300'}`}
        />
      ))}
    </div>
  )
}

export function TaskIllustration({ spec }: { spec: IllustrationSpec }) {
  switch (spec.kind) {
    case 'clock':
      return <Clock hour={spec.hour} minute={spec.minute} label={spec.label} />
    case 'shapes':
      return <Shapes shapes={spec.shapes} highlight={spec.highlight} />
    case 'domino':
      return <Domino left={spec.left} right={spec.right} />
    case 'number-line':
      return <NumberLine from={spec.from} to={spec.to} marks={spec.marks} />
    case 'bars':
      return <Bars values={spec.values} labels={spec.labels} />
    case 'grid':
      return <Grid rows={spec.rows} cols={spec.cols} filled={spec.filled} />
  }
}
