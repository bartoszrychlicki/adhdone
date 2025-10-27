"use client"

import { useEffect, useMemo, useState } from "react"

type CountdownTimerProps = {
  target: string
  label?: string
}

function formatRemaining(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const hours = Math.floor(clamped / 3600)
  const minutes = Math.floor((clamped % 3600) / 60)
  const secs = clamped % 60

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`
  }

  return `${minutes.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`
}

export function CountdownTimer({ target, label }: CountdownTimerProps) {
  const targetDate = useMemo(() => new Date(target), [target])
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000)))

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000)))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  if (!Number.isFinite(remaining)) {
    return null
  }

  return (
    <span aria-live="polite" className="font-mono text-xs text-violet-100/80">
      {label ? `${label}: ${formatRemaining(remaining)}` : formatRemaining(remaining)}
    </span>
  )
}

