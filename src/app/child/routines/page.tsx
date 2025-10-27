import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  ListCheck,
  Timer,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { fetchChildRoutineBoard } from "@/lib/child/queries"
import type { ChildRoutineBoardData } from "@/lib/child/types"
import { createSupabaseServerClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type RoutineCardProps = {
  sessionId: string
  routineId: string
  name: string
  status: "today" | "upcoming" | "completed"
  startAt: string | null
  endAt: string | null
  pointsAvailable: number
}

function RoutineStatusBadge({ status }: { status: RoutineCardProps["status"] }) {
  const map: Record<RoutineCardProps["status"], { label: string; className: string }> = {
    today: {
      label: "Dostępna teraz",
      className: "border-teal-400/60 bg-teal-500/20 text-teal-50",
    },
    upcoming: {
      label: "Wkrótce",
      className: "border-indigo-400/60 bg-indigo-500/20 text-indigo-50",
    },
    completed: {
      label: "Ukończona",
      className: "border-emerald-400/60 bg-emerald-500/20 text-emerald-50",
    },
  }

  const { label, className } = map[status]
  return (
    <Badge variant="outline" className={cn("text-xs uppercase tracking-wide", className)}>
      {label}
    </Badge>
  )
}

function RoutineCard({ routine }: { routine: RoutineCardProps }) {
  const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const windowLabel =
    routine.startAt && routine.endAt
      ? `${dateFormatter.format(new Date(routine.startAt))} – ${dateFormatter.format(new Date(routine.endAt))}`
      : routine.startAt
        ? `${dateFormatter.format(new Date(routine.startAt))}`
        : "Brak zaplanowanej godziny"

  const canStart = routine.status === "today"

  return (
    <Card
      className={cn(
        "h-full border-slate-800/60 bg-slate-900/40 text-slate-100 transition hover:border-white/30 hover:shadow-lg hover:shadow-teal-900/30",
        canStart ? "border-teal-400/50" : routine.status === "upcoming" ? "border-indigo-400/50" : "opacity-90"
      )}
    >
      <Link
        href={`/child/routines/${routine.sessionId}`}
        className="flex h-full flex-col gap-4 px-5"
      >
        <CardHeader className="space-y-3 px-0">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-white">{routine.name}</CardTitle>
            <RoutineStatusBadge status={routine.status} />
          </div>
          <CardDescription className="flex items-center gap-2 text-xs text-violet-200/80">
            <CalendarClock className="size-3.5" aria-hidden />
            {windowLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-4 px-0 pb-5">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm text-slate-200/90">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300/80">
              <ListCheck className="size-3.5 text-teal-200" aria-hidden />
              Punkty do zdobycia
            </p>
            <p className="mt-2 text-2xl font-semibold text-teal-200">{routine.pointsAvailable} pkt</p>
            <p className="text-xs text-slate-300/80">Wszystkie zadania dają bonus do serii.</p>
          </div>
          <Button
            type="button"
            className="mt-auto inline-flex items-center justify-center gap-2"
            variant={canStart ? "default" : "outline"}
            disabled={!canStart}
          >
            {canStart ? (
              <>
                Rozpocznij rutynę
                <ArrowRight className="size-4" aria-hidden />
              </>
            ) : (
              "Zobacz szczegóły"
            )}
          </Button>
        </CardContent>
      </Link>
    </Card>
  )
}

function flattenRoutines(board: ChildRoutineBoardData): RoutineCardProps[] {
  return [
    ...board.today.map((routine) => ({ ...routine })),
    ...board.upcoming.map((routine) => ({ ...routine })),
    ...board.completed.map((routine) => ({ ...routine })),
  ]
}

export default async function ChildRoutinesPage() {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/child")
  }

  if (activeProfile.role !== "child") {
    redirect("/parent/dashboard")
  }

  const supabase = await createSupabaseServerClient()
  const board = await fetchChildRoutineBoard(supabase, activeProfile.id)
  const routines = flattenRoutines(board)
  const availableToday = board.today.length
  const totalPointsToday = board.today.reduce((sum, routine) => sum + routine.pointsAvailable, 0)
  const completedCount = board.completed.length

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-violet-200/70">Twoje rutyny</p>
        <h2 className="text-2xl font-semibold text-white">Pełny harmonogram dnia</h2>
        <p className="text-sm text-violet-100/80">
          Sprawdź, które misje są dostępne teraz, które rozpoczną się wkrótce i co już udało się ukończyć.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-teal-400/40 bg-teal-500/10 text-teal-50">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Timer className="size-4" aria-hidden />
              Dostępne dziś
            </CardTitle>
            <CardDescription className="text-sm text-teal-100/90">
              Gotowe do rozpoczęcia w tej chwili.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{availableToday}</CardContent>
        </Card>

        <Card className="border-violet-400/40 bg-violet-500/10 text-violet-50">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Clock className="size-4" aria-hidden />
              Łączna pula punktów
            </CardTitle>
            <CardDescription className="text-sm text-violet-100/90">
              Wykonaj wszystkie zadania, aby zdobyć dodatkowy bonus.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{totalPointsToday} pkt</CardContent>
        </Card>

        <Card className="border-emerald-400/40 bg-emerald-500/10 text-emerald-50">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <CheckCircle2 className="size-4" aria-hidden />
              Już ukończone
            </CardTitle>
            <CardDescription className="text-sm text-emerald-100/90">
              Świetna robota! Pamiętaj, by zakończyć wszystkie misje.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{completedCount}</CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-white">Lista rutyn</h3>
          <p className="text-xs text-violet-200/70">
            Kliknij kartę, aby zobaczyć zadania i rozpocząć, gdy rutyna jest dostępna.
          </p>
        </header>

        {routines.length === 0 ? (
          <Card className="border-slate-800/60 bg-slate-900/40 text-slate-200/80">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">Brak zaplanowanych rutyn</CardTitle>
              <CardDescription className="text-sm">
                Poproś rodzica o skonfigurowanie rutyn w panelu administracyjnym.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {routines.map((routine) => (
              <RoutineCard key={`${routine.sessionId}-${routine.routineId}`} routine={routine} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
