'use client'

import { useMemo } from "react"
import { CloudOff, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type OfflineQueueStatusProps = {
  pending: number
  lastSyncedAt?: string | null
  className?: string
  onRetry?: () => void
}

function formatRelativeTime(lastSyncedAt?: string | null) {
  if (!lastSyncedAt) {
    return "Synchronizacja nieznana"
  }

  try {
    const lastSync = new Date(lastSyncedAt)
    const diff = Date.now() - lastSync.getTime()
    if (Number.isNaN(diff)) {
      throw new Error("Invalid date")
    }
    const minutes = Math.round(diff / (60 * 1000))
    if (minutes <= 0) {
      return "Zsynchronizowano przed chwilą"
    }
    if (minutes === 1) {
      return "Zsynchronizowano minutę temu"
    }
    if (minutes < 60) {
      return `Zsynchronizowano ${minutes} min temu`
    }
    const hours = Math.round(minutes / 60)
    return `Zsynchronizowano ${hours} h temu`
  } catch {
    return "Zsynchronizowano niedawno"
  }
}

export function OfflineQueueStatus({
  pending,
  lastSyncedAt,
  className,
  onRetry,
}: OfflineQueueStatusProps) {
  const syncInfo = useMemo(() => formatRelativeTime(lastSyncedAt), [lastSyncedAt])

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-amber-200/80">
        <CloudOff className="size-4" aria-hidden />
        Tryb offline
      </div>
      <p className="text-base font-semibold text-white">
        {pending > 0 ? `W kolejce: ${pending} zadań` : "Brak zadań do synchronizacji"}
      </p>
      <p className="text-xs text-amber-100/80">{syncInfo}</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start border-amber-500/50 text-amber-100"
        onClick={onRetry}
        disabled={!onRetry}
      >
        <RefreshCcw className="mr-2 size-4" aria-hidden />
        Spróbuj zsynchronizować
      </Button>
    </div>
  )
}
