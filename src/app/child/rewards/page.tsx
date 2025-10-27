import { redirect } from "next/navigation"
import { Lock } from "lucide-react"

import { RewardImage } from "@/app/parent/rewards/reward-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { fetchChildRewardsSnapshot } from "@/lib/child/queries"
import { createSupabaseServerClient } from "@/lib/supabase"

export default async function ChildRewardsPage() {
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
  const snapshot = await fetchChildRewardsSnapshot(supabase, activeProfile.familyId, activeProfile.id)
  const pointsBalance = snapshot.balance

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-violet-200/70">Sklep nagród</p>
        <h2 className="text-2xl font-semibold text-white">Na co chcesz wymienić punkty?</h2>
        <p className="text-sm text-violet-100/80">
          Aktualne saldo:{" "}
          <span className="font-semibold text-white">{pointsBalance} pkt</span>. Nagroda zostanie wysłana do rodzica do
          akceptacji.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {snapshot.rewards.map((reward) => {
          const canRedeem = reward.isActive && reward.costPoints <= pointsBalance
          const label = !reward.isActive
            ? "Nagroda ukryta"
            : reward.costPoints > pointsBalance
              ? "Za mało punktów"
              : "Wymień punkty"

          return (
            <Card
              key={reward.id}
              className="flex h-full flex-col overflow-hidden border-slate-800/60 bg-slate-900/40 text-slate-100 transition hover:border-teal-300/50"
            >
              <div className="relative h-36 w-full border-b border-slate-800/60">
                <RewardImage src={reward.imageUrl ?? undefined} alt={reward.name} />
              </div>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center justify-between text-base font-semibold text-white">
                  {reward.name}
                  <span className="rounded-full border border-teal-400/40 bg-teal-500/15 px-3 py-1 text-xs text-teal-100">
                    {reward.costPoints} pkt
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-200/70">
                  {reward.source === "template" ? "Nagroda z szablonu" : reward.source === "custom" ? "Nagroda dodana przez rodzica" : "Nagroda rodzinna"}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-3">
                <Button size="sm" disabled={!canRedeem}>
                  {label}
                </Button>
                {!reward.isActive ? (
                  <p className="flex items-center gap-2 text-xs text-amber-200/80">
                    <Lock className="size-3.5" aria-hidden />
                    Rodzic ukrył tę nagrodę. Zapytaj, czy można ją odblokować.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
