import { redirect } from "next/navigation"
import { CalendarCheck2, Flame, Medal } from "lucide-react"

import { RewardImage } from "@/app/parent/rewards/reward-image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { fetchChildProfileSnapshot } from "@/lib/child/queries"
import { createSupabaseServerClient } from "@/lib/supabase"

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" })
  } catch {
    return value
  }
}

export default async function ChildProfilePage() {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/child")
  }

  if (activeProfile.role !== "child") {
    redirect("/parent/dashboard")
  }

  if (!activeProfile.familyId) {
    throw new Error("Profil dziecka nie ma przypisanej rodziny.")
  }

  const supabase = await createSupabaseServerClient()
  const profile = await fetchChildProfileSnapshot(supabase, activeProfile.familyId, activeProfile.id)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-violet-200/70">Profil i osiągnięcia</p>
        <h2 className="text-2xl font-semibold text-white">Tak wygląda Twoja przygoda</h2>
        <p className="text-sm text-violet-100/80">
          Seria dni bez przerwy:{" "}
          <span className="font-semibold text-white">{profile.streakDays}</span>. Razem zdobyte punkty:{" "}
          <span className="font-semibold text-white">{profile.totalPoints}</span>.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
              <Medal className="size-5 text-amber-300" aria-hidden />
              Zdobyte odznaki
            </CardTitle>
            <CardDescription className="text-sm text-slate-200/80">
              Każda odznaka to dowód Twojego wysiłku. Zbierz je wszystkie!
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {profile.achievements.length === 0 ? (
              <p className="rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-6 text-sm text-slate-300/80">
                Odznaki pojawią się automatycznie, gdy zaczniesz zdobywać kolejne sukcesy.
              </p>
            ) : (
              profile.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-amber-400/40 bg-amber-500/10">
                      <RewardImage src={achievement.iconUrl ?? undefined} alt={achievement.name} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{achievement.name}</p>
                      <p className="text-xs text-slate-300/80">Odblokowano: {formatDate(achievement.unlockedAt)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-200/80">{achievement.description ?? "Brak opisu"}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-teal-400/40 bg-teal-500/10 text-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
              <Flame className="size-5" aria-hidden />
              Seria sukcesów
            </CardTitle>
            <CardDescription className="text-sm text-teal-100/90">
              Codziennie loguj się i kończ rutyny, aby utrzymać serię. Zyskasz dodatkowe nagrody!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-teal-100/90">
            <p>
              Obecna seria: <span className="text-white">{profile.streakDays} dni</span>.
            </p>
            <p>Zapasowe punkty motywacyjne: <span className="text-white">{profile.totalPoints} pkt</span>.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Ostatnie rutyny</h3>
          <span className="text-xs text-violet-200/80">Historia z ostatnich dni</span>
        </header>
        {profile.routineHistory.length === 0 ? (
          <p className="rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-6 text-sm text-slate-200/80">
            Gdy ukończysz pierwszą rutynę, zobaczysz ją tutaj wraz z punktami.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {profile.routineHistory.map((entry) => (
              <Card key={entry.id} className="border-slate-800/60 bg-slate-900/40 text-slate-100">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base font-semibold text-white">{entry.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs text-slate-200/80">
                    <CalendarCheck2 className="size-3.5 text-violet-200" aria-hidden />
                    {formatDate(entry.completedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-teal-100">
                  +{entry.pointsEarned} pkt dodanych do salda.
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
