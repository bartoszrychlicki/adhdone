import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { CalendarClock, Check, Play, Square } from "lucide-react"

import { toggleRoutineActiveAction } from "./actions"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { createSupabaseServerClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function formatTimeRange(start: string | null, end: string | null) {
  const format = (value: string | null) => (value ? value.slice(0, 5) : "—")
  return `${format(start)} – ${format(end)}`
}

type RoutineRow = {
  id: string
  name: string
  routineType: string
  startTime: string | null
  endTime: string | null
  autoCloseAfterMinutes: number | null
  isActive: boolean
  childrenCount: number
}

type ToggleFormProps = {
  routineId: string
  isActive: boolean
}

export const metadata: Metadata = {
  title: "Rutyny rodzica",
  description: "Lista rutyn rozpisanych dla dzieci wraz z możliwością ich aktywacji i edycji.",
}

function ToggleForm({ routineId, isActive }: ToggleFormProps) {
  return (
    <form action={toggleRoutineActiveAction} className="inline-flex">
      <input type="hidden" name="routineId" value={routineId} />
      <input type="hidden" name="isActive" value={(!isActive).toString()} />
      <Button
        type="submit"
        variant={isActive ? "destructive" : "default"}
        size="sm"
        className={
          isActive
            ? "border border-red-500/60 bg-red-500/25 text-red-50 hover:bg-red-500/40"
            : "border border-emerald-500/50 bg-emerald-500/20 text-emerald-950 hover:bg-emerald-500/35"
        }
      >
        {isActive ? (
          <>
            <Square className="mr-2 size-4" aria-hidden />
            Deaktywuj
          </>
        ) : (
          <>
            <Play className="mr-2 size-4" aria-hidden />
            Aktywuj
          </>
        )}
      </Button>
    </form>
  )
}

export default async function ParentRoutinesPage() {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/parent")
  }

  if (!activeProfile.familyId) {
    throw new Error("Brak przypisanej rodziny.")
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("routines")
    .select(
      "id, name, routine_type, start_time, end_time, auto_close_after_minutes, is_active, child_routines(count)"
    )
    .eq("family_id", activeProfile.familyId)
    .is("deleted_at", null)
    .order("routine_type", { ascending: true })

  if (error) {
    console.error("[ParentRoutinesPage] failed to load", error)
    throw new Error("Nie udało się pobrać listy rutyn.")
  }

  const routines: RoutineRow[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    routineType: row.routine_type,
    startTime: row.start_time,
    endTime: row.end_time,
    autoCloseAfterMinutes: row.auto_close_after_minutes,
    isActive: row.is_active,
    childrenCount: (row.child_routines?.[0]?.count as number | undefined) ?? 0,
  }))

  if (routines.length === 0) {
    return (
      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader className="space-y-3">
          <CardTitle className="text-xl font-semibold">Rutyny nie są jeszcze skonfigurowane</CardTitle>
          <CardDescription className="text-sm text-slate-200/80">
            Wróć do kreatora onboarding, aby utworzyć rutyny i przypisać do nich zadania.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/onboarding/routines">Przejdź do konfiguracji</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold">Rutyny domowe</CardTitle>
              <CardDescription className="text-sm text-slate-200/80">
                Przeglądaj skonfigurowane rutyny i decyduj, które mają być obecnie aktywne.
              </CardDescription>
            </div>
            <Button asChild variant="outline" className="border-slate-800/60 bg-slate-900/50 text-white">
              <Link href="/onboarding/routines">Edytuj w kreatorze</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300/80">
            <span className="flex items-center gap-1">
              <CalendarClock className="size-4" aria-hidden />
              Godziny pomagają automatycznie śledzić rekordy czasowe.
            </span>
            <span className="flex items-center gap-1">
              <Check className="size-4" aria-hidden />
              Aktywna rutyna może być uruchomiona przez dziecko.
            </span>
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden rounded-2xl border border-slate-800/60">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60 text-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Rutyna</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Okno czasowe</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Auto-zakończenie</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Przypisane dzieci</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 bg-slate-950/40 text-slate-200">
              {routines.map((routine) => (
                <tr key={routine.id}>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-white">{routine.name}</span>
                      <Badge variant="outline" className="w-fit border-slate-800/60 bg-slate-900/60 text-xs text-slate-300">
                        {ROUTINE_TYPE_LABEL[routine.routineType] ?? routine.routineType}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-300">{formatTimeRange(routine.startTime, routine.endTime)}</td>
                  <td className="px-4 py-4 align-top text-slate-300">
                    {routine.autoCloseAfterMinutes ? `${routine.autoCloseAfterMinutes} min` : "—"}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-300">{routine.childrenCount}</td>
                  <td className="px-4 py-4 align-top">
                    {routine.isActive ? (
                      <Badge className="bg-emerald-500/20 text-emerald-200">Aktywna</Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-700/60 text-slate-300">
                        Nieaktywna
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <div className="flex justify-end gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="bg-slate-100 text-slate-900 hover:bg-slate-200"
                      >
                        <Link href={`/parent/routines/${routine.id}`}>Edytuj</Link>
                      </Button>
                      <ToggleForm routineId={routine.id} isActive={routine.isActive} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

const ROUTINE_TYPE_LABEL: Record<string, string> = {
  morning: "Poranna",
  afternoon: "Popołudniowa",
  evening: "Wieczorna",
}
