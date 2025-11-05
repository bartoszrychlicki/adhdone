import { CheckCircle2, Clock, Sparkles, Timer } from "lucide-react"
import type { Metadata } from "next"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChildRoutineTabs } from "./components/ChildRoutineTabs"
import { buildChildRoutineTabsModel } from "./tab-model"
import { fetchChildProfileSnapshot, fetchChildRoutineBoard, fetchChildRoutineSessionViewModelForChild } from "@/lib/child/queries"
import type { ChildRoutineSessionViewModel } from "@/lib/child/types"
import { createSupabaseServiceRoleClient } from "@/lib/supabase"
import { requireChildSession } from "@/lib/auth/child-session"

export const metadata: Metadata = {
  title: "Lista rutyn",
  description: "Przeglądaj dostępne, nadchodzące i ukończone rutyny dnia.",
}
export default async function ChildRoutinesPage() {
  const session = await requireChildSession()
  const supabase = createSupabaseServiceRoleClient()
  const board = await fetchChildRoutineBoard(supabase, session.childId)
  const profileSnapshotPromise = fetchChildProfileSnapshot(supabase, session.familyId, session.childId)

  const { data: timezoneRow } = await supabase
    .from("profiles")
    .select("families(timezone)")
    .eq("id", session.childId)
    .maybeSingle<{ families: { timezone: string | null } | null }>()

  const timezone = timezoneRow?.families?.timezone ?? "Europe/Warsaw"

  const sessionIds = [
    ...board.today,
    ...board.upcoming,
    ...board.completed,
  ].map((preview) => preview.sessionId)

  const uniqueSessionIds = Array.from(new Set(sessionIds))

  const routineSessions = await Promise.all(
    uniqueSessionIds.map(async (sessionId) => {
      const details = await fetchChildRoutineSessionViewModelForChild(supabase, sessionId, session.childId)
      return details
    })
  )

  const sessionsWithData = routineSessions.filter(Boolean) as ChildRoutineSessionViewModel[]
  const { tabs } = buildChildRoutineTabsModel({
    board,
    sessions: sessionsWithData,
    timezone,
  })

  const profileSnapshot = await profileSnapshotPromise

  const availableToday = board.today.length
  const totalPointsToday = board.today.reduce((sum, routine) => sum + routine.pointsAvailable, 0)
  const completedCount = board.completed.length
  const streakDays = profileSnapshot.streakDays
  const balancePoints = profileSnapshot.totalPoints

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-violet-200/70">Twoje rutyny</p>
        <h2 className="text-2xl font-semibold text-white">Pełny harmonogram dnia</h2>
        <p className="text-sm text-violet-100/80">
          Sprawdź, które misje są dostępne teraz, które rozpoczną się wkrótce i co już udało się ukończyć.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-5 md:grid-cols-2">
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

        <Card className="border-amber-400/40 bg-amber-500/10 text-amber-50">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Sparkles className="size-4" aria-hidden />
              Seria dni
            </CardTitle>
            <CardDescription className="text-sm text-amber-100/90">
              Utrzymuj rytm, aby zdobywać dodatkowe nagrody.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{streakDays}</CardContent>
        </Card>

        <Card className="border-cyan-400/40 bg-cyan-500/10 text-cyan-50">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Clock className="size-4" aria-hidden />
              Zebrane punkty
            </CardTitle>
            <CardDescription className="text-sm text-cyan-100/90">
              Wykorzystaj punkty na nagrody w swoim sklepie.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{balancePoints}</CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        {tabs.length === 0 ? (
          <Card className="border-slate-800/60 bg-slate-900/40 text-slate-200/80">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">Brak zaplanowanych rutyn</CardTitle>
              <CardDescription className="text-sm">
                Poproś rodzica o skonfigurowanie rutyn w panelu administracyjnym.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ChildRoutineTabs tabs={tabs} />
        )}
      </section>
    </div>
  )
}
