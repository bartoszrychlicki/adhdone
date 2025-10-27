import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Info, Users } from "lucide-react"

import { createSupabaseServerClient } from "@/lib/supabase"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { TaskRow } from "./(components)/task-row"

function formatTimeRange(start: string | null, end: string | null) {
  const format = (value: string | null) => (value ? value.slice(0, 5) : "—")
  return `${format(start)} – ${format(end)}`
}

type RoutineDetails = {
  id: string
  name: string
  routineType: string | null
  startTime: string | null
  endTime: string | null
  autoCloseAfterMinutes: number | null
  isActive: boolean
  childCount: number
  tasks: Array<{
    id: string
    name: string
    description: string | null
    points: number
    position: number
    isOptional: boolean
    isActive: boolean
  }>
}

export default async function RoutineDetailsPage({ params }: { params: { routineId: string } }) {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/parent")
  }

  if (!activeProfile.familyId) {
    throw new Error("Brak przypisanej rodziny.")
  }

  const routineId = params.routineId

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("routines")
    .select(
      `id, name, routine_type, start_time, end_time, auto_close_after_minutes, is_active,
      child_routines(count),
      routine_tasks(id, name, description, points, position, is_optional, is_active)`
    )
    .eq("family_id", activeProfile.familyId)
    .eq("id", routineId)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) {
    console.error("[RoutineDetailsPage] load failed", error)
    throw new Error("Nie udało się pobrać szczegółów rutyny.")
  }

  if (!data) {
    notFound()
  }

  const routine: RoutineDetails = {
    id: data.id,
    name: data.name,
    routineType: data.routine_type,
    startTime: data.start_time,
    endTime: data.end_time,
    autoCloseAfterMinutes: data.auto_close_after_minutes,
    isActive: data.is_active,
    childCount: (data.child_routines?.[0]?.count as number | undefined) ?? 0,
    tasks: (data.routine_tasks ?? [])
      .filter((task) => task != null)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((task) => ({
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
              <CardTitle className="text-2xl font-semibold">{routine.name}</CardTitle>
              <CardDescription className="text-sm text-slate-200/80">
                Zarządzaj zadaniami oraz przypisaniami tej rutyny. Zmiany widoczne są dla wszystkich dzieci.
              </CardDescription>
            </div>
            <Button asChild variant="outline" className="border-slate-800/60 bg-slate-900/50 text-white">
              <Link href="/parent/routines">Wróć do listy</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300/80">
            <span className="flex items-center gap-1">
              <Users className="size-4" aria-hidden />
              Przypisane dzieci: {routine.childCount}
            </span>
            <span className="flex items-center gap-1">
              <Info className="size-4" aria-hidden />
              Okno czasowe: {formatTimeRange(routine.startTime, routine.endTime)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 text-sm text-slate-200/90">
            <Switch disabled defaultChecked={routine.isActive} />
            <div className="space-y-1">
              <p className="font-medium text-white">Status rutyny</p>
              <p className="text-xs text-slate-300/80">
                Aktywację/wyłączenie rutyny wykonasz z poziomu listy rutyn. Tutaj edytujesz tylko zadania.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Zadania rutyny</CardTitle>
          <CardDescription className="text-sm text-slate-200/80">
            Przeciągaj zadania, aby zmienić ich kolejność. Edytuj punktację i oznacz zadania jako opcjonalne.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {routine.tasks.length === 0 ? (
            <Alert className="border-slate-800/60 bg-slate-900/40 text-slate-200/80">
              <AlertTitle>Brak zadań</AlertTitle>
              <AlertDescription>
                Dodaj zadania poprzez kreator rutyn lub z panelu zadań indywidualnych.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {routine.tasks.map((task) => (
                <TaskRow key={task.id} task={task} routineId={routine.id} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
