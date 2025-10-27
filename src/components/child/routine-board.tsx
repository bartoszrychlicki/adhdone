import Link from "next/link"
import { ArrowRight, Clock3, Trophy } from "lucide-react"

import { CountdownTimer } from "./countdown-timer"
import type { ChildRoutineBoardData, ChildRoutinePreview } from "@/lib/child/types"
import { cn } from "@/lib/utils"

function formatTime(value: string | null) {
  if (!value) {
    return "Brak godziny"
  }

  try {
    return new Date(value).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return "Brak godziny"
  }
}

function RoutineCard({ routine }: { routine: ChildRoutinePreview }) {
  const isDisabled = routine.status === "completed" || routine.status === "upcoming"
  const startLabel = formatTime(routine.startAt)
  const endLabel = formatTime(routine.endAt)

  const cardColors = {
    today: "border-teal-500/40 bg-slate-900/40",
    upcoming: "border-indigo-500/40 bg-indigo-900/20",
    completed: "border-emerald-500/30 bg-emerald-900/10",
  } as const

  return (
    <Link
      href={`/child/routines/${routine.sessionId}`}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border px-5 py-6 text-left transition hover:scale-[1.01] hover:border-white/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-300/60",
        cardColors[routine.status],
        isDisabled ? "opacity-90" : "opacity-100"
      )}
      aria-disabled={isDisabled && routine.status !== "today"}
      tabIndex={0}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-teal-100/70">
            {routine.status === "today" ? "Dostępna teraz" : routine.status === "upcoming" ? "Wkrótce" : "Zakończona"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{routine.name}</h3>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-teal-400/40 bg-teal-500/15 px-3 py-1 text-xs text-teal-100">
          <Trophy className="size-3.5" aria-hidden />
          {routine.pointsAvailable} pkt
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-violet-100/70">
        <Clock3 className="size-3.5" aria-hidden />
        <span>
          {startLabel} – {endLabel}
        </span>
        {routine.status !== "completed" && routine.startAt ? (
          <CountdownTimer target={routine.startAt} label={routine.status === "today" ? "Start za" : "Początek za"} />
        ) : null}
      </div>

      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-100/80">
        {routine.status === "today" ? "Wejdź do rutyny" : "Szczegóły"} <ArrowRight className="size-3" aria-hidden />
      </span>
    </Link>
  )
}

export function RoutineBoard({ routines }: { routines: ChildRoutineBoardData }) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="routine-today" className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 id="routine-today" className="text-xl font-semibold text-white">
            Co dziś na liście?
          </h2>
          <span className="text-xs uppercase tracking-wide text-teal-200/80">Tryb focus</span>
        </header>
        <div className="grid gap-4">
          {routines.today.map((routine) => (
            <RoutineCard key={`${routine.sessionId}-${routine.routineId}`} routine={routine} />
          ))}
        </div>
      </section>

      <section aria-labelledby="routine-upcoming" className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 id="routine-upcoming" className="text-lg font-semibold text-white">
            Nadchodzące rutyny
          </h2>
          <span className="text-xs text-violet-200/70">Przygotuj się z wyprzedzeniem</span>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {routines.upcoming.length === 0 ? (
            <p className="rounded-2xl border border-slate-800/60 bg-slate-900/30 px-4 py-3 text-sm text-slate-200/80">
              Brak rutyn w kolejce. Poproś rodzica o zaplanowanie kolejnych misji.
            </p>
          ) : (
            routines.upcoming.map((routine) => (
              <RoutineCard key={`${routine.sessionId}-${routine.routineId}`} routine={routine} />
            ))
          )}
        </div>
      </section>

      <section aria-labelledby="routine-completed" className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 id="routine-completed" className="text-lg font-semibold text-white">
            Ukończone rutyny
          </h2>
          <span className="text-xs text-emerald-200/80">Świetna robota!</span>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {routines.completed.length === 0 ? (
            <p className="rounded-2xl border border-slate-800/60 bg-slate-900/30 px-4 py-3 text-sm text-slate-200/80">
              Jeszcze żadnej nie ukończono dzisiaj. Zaczynamy!
            </p>
          ) : (
            routines.completed.map((routine) => (
              <RoutineCard key={`${routine.sessionId}-${routine.routineId}`} routine={routine} />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
