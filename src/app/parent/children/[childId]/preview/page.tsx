import { notFound, redirect } from "next/navigation"

import Link from "next/link"

import { AppShellChild } from "@/components/child/app-shell-child"
import { RoutineBoard } from "@/components/child/routine-board"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/lib/supabase"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import {
  fetchChildProfileSnapshot,
  fetchChildRewardsSnapshot,
  fetchChildRoutineBoard,
} from "@/lib/child/queries"

type PreviewPageProps = {
  params: Promise<{
    childId: string
  }>
}

export default async function ParentChildPreviewPage({ params }: PreviewPageProps) {
  const { childId } = await params
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/parent")
  }

  if (activeProfile.role !== "parent") {
    redirect("/parent/dashboard")
  }

  if (!activeProfile.familyId) {
    throw new Error("Brak przypisanej rodziny.")
  }

  const supabase = await createSupabaseServerClient()

  const { data: childProfile, error: childError } = await supabase
    .from("profiles")
    .select("id, display_name, family_id")
    .eq("id", childId)
    .eq("family_id", activeProfile.familyId)
    .eq("role", "child")
    .is("deleted_at", null)
    .maybeSingle()

  if (childError) {
    throw new Error("Nie udało się pobrać danych dziecka.")
  }

  if (!childProfile) {
    notFound()
  }

  const [{ data: family }, routineBoard, rewardsSnapshot, profileSnapshot] = await Promise.all([
    supabase.from("families").select("family_name").eq("id", activeProfile.familyId).maybeSingle(),
    fetchChildRoutineBoard(supabase, childProfile.id),
    fetchChildRewardsSnapshot(supabase, activeProfile.familyId, childProfile.id),
    fetchChildProfileSnapshot(supabase, activeProfile.familyId, childProfile.id),
  ])

  const familyName = family?.family_name ?? "Twoja rodzina"

  return (
    <AppShellChild
      childName={childProfile.display_name}
      familyName={familyName}
      pointsBalance={rewardsSnapshot.balance}
      returnHref="/parent/children"
    >
      <div className="flex flex-col gap-6">
        <Alert className="border-amber-400/40 bg-amber-500/10 text-amber-50">
          <AlertTitle>Podgląd interfejsu dziecka</AlertTitle>
          <AlertDescription>
            Widzisz aplikację tak, jak zobaczy ją {childProfile.display_name}. Nie możesz jednak wykonywać zadań
            ani odejmować punktów — wyloguj się i użyj tokenu, aby przejść do trybu dziecka.
          </AlertDescription>
        </Alert>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Najbliższe rutyny</h2>
            <Button asChild variant="outline" className="border-slate-800/60 bg-slate-900/50 text-xs">
              <Link href="/parent/children">Powrót do panelu rodzica</Link>
            </Button>
          </div>
          <RoutineBoard
            routines={routineBoard}
            getRoutineHref={(routine) => `/parent/children/${childProfile.id}/preview/routines/${routine.sessionId}`}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 text-slate-100">
            <h3 className="text-base font-semibold text-white">Ostatnie osiągnięcia</h3>
            {profileSnapshot.achievements.length === 0 ? (
              <p className="mt-2 text-sm text-slate-300/80">Dziecko jeszcze nie zdobyło odznak.</p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {profileSnapshot.achievements.slice(0, 4).map((achievement) => (
                  <li key={achievement.id} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                    <p className="text-sm font-semibold text-white">{achievement.name}</p>
                    <p className="text-xs text-slate-300/80">{achievement.description ?? "Brak opisu"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 text-slate-100">
            <h3 className="text-base font-semibold text-white">Historia rutyn</h3>
            {profileSnapshot.routineHistory.length === 0 ? (
              <p className="mt-2 text-sm text-slate-300/80">Brak zakończonych rutyn w najnowszej historii.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-200/80">
                {profileSnapshot.routineHistory.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white">{entry.name}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.completedAt).toLocaleDateString("pl-PL", { dateStyle: "medium" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AppShellChild>
  )
}
