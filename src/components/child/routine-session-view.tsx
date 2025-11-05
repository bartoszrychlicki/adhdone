"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Trophy } from "lucide-react"

import { SequentialTaskList } from "./sequential-task-list"
import { SessionTimer } from "./session-timer"
import { OfflineQueueStatus } from "@/components/errors/offline-queue-status"
import type { ChildRoutineSessionViewModel } from "@/lib/child/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type RoutineSessionViewProps = {
  session: ChildRoutineSessionViewModel
  sessionId: string
}

function SessionProgressBar({ completed, total }: { completed: number; total: number }) {
  const percent = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-violet-100/80">
        <span>Postęp kroków</span>
        <span aria-live="polite">{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 via-violet-400 to-emerald-400 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function RoutineSessionView({ session, sessionId }: RoutineSessionViewProps) {
  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    session.steps.filter((step) => step.status === "completed").map((step) => step.id)
  )
  const totalSteps = session.steps.length
  const completedCount = completedIds.length
  const lastSyncedAt = useMemo(() => {
    const date = new Date()
    date.setMinutes(date.getMinutes() - 12)
    return date.toISOString()
  }, [])

  useEffect(() => {
    setCompletedIds(session.steps.filter((step) => step.status === "completed").map((step) => step.id))
  }, [session.steps])

  const orderedSteps = useMemo(
    () =>
      session.steps.map((step) => ({
        ...step,
      })),
    [session.steps]
  )

  const handleCompletedChange = useCallback((ids: string[]) => {
    setCompletedIds(ids)
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-violet-200/70">Aktywna rutyna</p>
            <h2 className="text-2xl font-semibold text-white">{session.routineName}</h2>
          </div>
          <SessionTimer startedAt={session.startedAt} plannedEndAt={session.plannedEndAt} />
        </div>
        <SessionProgressBar completed={completedCount} total={totalSteps} />
        <div className="flex gap-2 text-xs text-violet-100/80">
          <Trophy className="size-3.5 text-teal-200" aria-hidden />
          Zdobądź wszystkie {session.totalPoints} punktów, aby utrzymać serię.
        </div>
      </header>

      <section className="space-y-4">
        <Card className="border-violet-500/40 bg-violet-900/30 text-violet-50 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-semibold text-white">Kroki do wykonania</CardTitle>
            <CardDescription className="text-sm text-violet-100/80">
              Skup się kolejno na każdej czynności. Po kliknięciu „Zrobione” przejdź do następnej.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <SequentialTaskList
              steps={orderedSteps}
              onCompleteChange={handleCompletedChange}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-emerald-500/40 bg-emerald-500/10 text-emerald-50">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg font-semibold text-white">Jesteś offline?</CardTitle>
            <CardDescription className="text-sm text-emerald-100/80">
              Rutyna działa również bez internetu. Postęp wyślemy do rodzica, gdy połączenie wróci.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OfflineQueueStatus
              pending={Math.max(0, totalSteps - completedCount)}
              lastSyncedAt={lastSyncedAt}
              onRetry={() => window.location.reload()}
            />
          </CardContent>
        </Card>

        <Card className="border-amber-500/40 bg-amber-500/10 text-amber-50">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg font-semibold text-white">Potrzebujesz przerwy?</CardTitle>
            <CardDescription className="text-sm text-amber-100/90">
              Pamiętaj, by wrócić w ciągu 5 minut, aby rutyna nie zakończyła się automatycznie.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-amber-100/80">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="size-4" aria-hidden />
              Gdy timer dojdzie do zera, rutyna zamknie się sama.
            </div>
            <Button size="sm" variant="outline" className="self-start border-amber-500/40 text-amber-100">
              Zrób krótką przerwę
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className={cn("flex items-center justify-center gap-3")}>
        <Button size="lg" className="min-w-[200px]" asChild>
          <Link href={`/child/routines/${sessionId}/success`}>Zakończ rutynę</Link>
        </Button>
      </div>
    </div>
  )
}
