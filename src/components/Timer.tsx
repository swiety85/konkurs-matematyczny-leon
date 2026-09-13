import { useEffect, useRef, useState } from 'react'

interface TimerProps {
  seconds: number
  running: boolean
  onExpire?: () => void
  warnBelowSec?: number
}

export function Timer({ seconds, running, onExpire, warnBelowSec = 300 }: TimerProps) {
  const [left, setLeft] = useState(seconds)
  const expiredRef = useRef(false)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  useEffect(() => {
    if (left === 0 && running && !expiredRef.current) {
      expiredRef.current = true
      onExpire?.()
    }
  }, [left, running, onExpire])

  const m = Math.floor(left / 60)
  const s = left % 60
  const urgent = left <= warnBelowSec

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-mono text-xl font-bold shadow-sm ${
        urgent ? 'bg-red-100 text-red-700 ring-2 ring-red-300' : 'bg-sky-100 text-sky-800'
      }`}
      aria-live="polite"
    >
      <span aria-hidden>⏱️</span>
      <span>
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    </div>
  )
}
