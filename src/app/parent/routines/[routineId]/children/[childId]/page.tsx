import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, CalendarClock, ListChecks } from "lucide-react"

import { createSupabaseServerClient } from "@/lib/supabase"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ChildTaskRow } from "./task-row"

function formatTimeRange(start: string | null, end: string | null) {
  const format = (value: string | null) => (value ? value.slice(0, 5) : "—")
  return `${format(start)} – ${format(end)}`
}

type RoutineTask = {
  id: string
  name: string
  description: string | null
  points: number
  position: number
  isOptional: boolean
  isActive: boolean
}

type ChildRoutineDetails = {
  routine: {
    id: string
    name: string
    startTime: string | null
    endTime: string | null
    autoCloseAfterMinutes: number | null
  }
  child: {
    id: string
    displayName: string
  }
  tasks: RoutineTask[]
}

export default async function ChildRoutinePage({ params }: { params: { routineId: string; childId: string } }) {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/parent")
  }

  if (!activeProfile.familyId) {
    throw new Error("Brak przypisanej rodziny.")
  }

  const supabase = await createSupabaseServerClient()

  const { routineId, childId } = params

  const { data, error } = await supabase
    .from("routine_tasks")
    .select(
      `id, name, description, points, position, is_optional, is_active,
        routines(id, name, start_time, end_time, auto_close_after_minutes),
        profiles!routine_tasks_child_profile_id_fkey(id, display_name)`
    )
    .eq("routine_id", routineId)
    .eq("child_profile_id", childId)
    .order("position", { ascending: true })

  if (error) {
    console.error("[ChildRoutinePage] failed to load", error)
    throw new Error("Nie udało się pobrać danych szczegółowych.")
  }

  if (!data || data.length === 0) {
    notFound()
  }

  const routine = data[0].routines
  const child = data[0].profiles as { id: string; display_name: string } | null

  if (!routine || !child) {
    notFound()
  }

  const details: ChildRoutineDetails = {
    routine: {
      id: routine.id,
      name: routine.name,
      startTime: routine.start_time,
      endTime: routine.end_time,
      autoCloseAfterMinutes: routine.auto_close_after_minutes,
    },
    child: {
      id: child.id,
      displayName: child.display_name,
    },
    tasks: data.map((task) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      points: task.points,
      position: task.position,
      isOptional: task.is_optional,
      isActive: task.is_active,
    })),
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold">{details.routine.name}</CardTitle>
              <CardDescription className="text-sm text-slate-200/80">
                Personalizuj zadania dla dziecka: {details.child.displayName}.
              </CardDescription>
            </div>
            <Button asChild variant="outline" className="border-slate-800/60 bg-slate-900/50 text-white">
              <Link href={`/parent/routines/${details.routine.id}`}>Wróć do rutyny</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300/80">
            <span className="flex items-center gap-1">
              <CalendarClock className="size-4" aria-hidden />
              Okno czasowe: {formatTimeRange(details.routine.startTime, details.routine.endTime)}
            </span>
            <span className="flex items-center gap-1">
              <ListChecks className="size-4" aria-hidden />
              Zmiany są widoczne tylko dla tego dziecka
            </span>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Zadania indywidualne</CardTitle>
          <CardDescription className="text-sm text-slate-200/80">
            Dostosuj punktację i widoczność zadań. Wyłączone zadanie pozostanie w kolejce, ale nie będzie dostępne.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {details.tasks.length === 0 ? (
            <Alert className="border-yellow-500/40 bg-yellow-500/10 text-yellow-100">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Brak zadań przypisanych do dziecka</AlertTitle>
              <AlertDescription>
                Dodaj zadania z poziomu rutyny, aby można je było personalizować.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {details.tasks.map((task) => (
                <ChildTaskRow key={task.id} task={task} routineId={details.routine.id} childId={details.child.id} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
