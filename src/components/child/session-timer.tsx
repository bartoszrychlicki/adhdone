"use client"

import { useEffect, useMemo, useState } from "react"
import { Hourglass } from "lucide-react"

type SessionTimerProps = {
  startedAt?: string | null
  plannedEndAt?: string | null
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export function SessionTimer({ startedAt, plannedEndAt }: SessionTimerProps) {
  const startDate = useMemo(() => (startedAt ? new Date(startedAt) : null), [startedAt])
  const endDate = useMemo(() => (plannedEndAt ? new Date(plannedEndAt) : null), [plannedEndAt])
  const [elapsed, setElapsed] = useState(() =>
    startDate ? Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 1000)) : 0
  )
  const hasStarted = Boolean(startDate)

  useEffect(() => {
    if (hasStarted && startDate) {
      setElapsed(Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 1000)))
    } else {
      setElapsed(0)
    }
  }, [hasStarted, startDate])

  useEffect(() => {
    if (!startDate) {
      return
    }

    const interval = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 1000)))
    }, 1000)

    return () => clearInterval(interval)
  }, [startDate])

  const remaining =
    hasStarted && endDate ? Math.max(0, Math.floor((endDate.getTime() - Date.now()) / 1000)) : null
  const statusLabel = hasStarted
    ? remaining !== null
      ? `Do końca: ${formatDuration(remaining)}`
      : "Trwająca misja"
    : "Gotowy do startu"

  return (
    <div className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-900/30 px-4 py-2 text-sm text-violet-100">
      <Hourglass className="size-4" aria-hidden />
      <div className="flex flex-col">
        <span className="font-semibold text-white" aria-live="polite">
          {hasStarted ? formatDuration(elapsed) : "00:00"}
        </span>
        <span className="text-xs text-violet-100/80">{statusLabel}</span>
      </div>
    </div>
  )
}
