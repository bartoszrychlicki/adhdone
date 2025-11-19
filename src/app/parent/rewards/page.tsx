import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { Gift, ToggleLeft, ToggleRight } from "lucide-react"

import { RewardImage } from "./reward-image"
import { toggleRewardActiveAction } from "./actions"
import { createSupabaseServerClient } from "@/lib/supabase"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type RewardRow = {
  id: string
  name: string
  description: string | null
  costPoints: number
  isActive: boolean
  isRepeatable: boolean
  settings: Record<string, unknown> | null
  createdAt: string
}

function resolveSource(settings: Record<string, unknown> | null): { label: string; badgeVariant: "default" | "outline" } {
  const templateId = settings?.templateId
  const source = settings?.source

  if (typeof templateId === "string") {
    return { label: "Szablon", badgeVariant: "default" }
  }

  if (source === "custom") {
    return { label: "Własna", badgeVariant: "outline" }
  }

  return { label: "Inne", badgeVariant: "outline" }
}

export const metadata: Metadata = {
  title: "Nagrody rodzica",
  description: "Zarządzaj nagrodami dostępnymi dla dzieci i kontroluj ich widoczność.",
}

export default async function ParentRewardsPage() {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/parent")
  }

  if (!activeProfile.familyId) {
    throw new Error("Brak przypisanej rodziny.")
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("rewards")
    .select("id, name, description, cost_points, is_active, is_repeatable, settings, created_at")
    .eq("family_id", activeProfile.familyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[ParentRewardsPage] failed to load", error)
    throw new Error("Nie udało się pobrać nagród.")
  }

  const rewards: RewardRow[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    costPoints: row.cost_points,
    isActive: row.is_active,
    isRepeatable: row.is_repeatable,
    settings: (row.settings as Record<string, unknown> | null) ?? null,
    createdAt: row.created_at,
  }))

  return (
    <div className="flex flex-col gap-6 pb-12">
      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold">Nagrody w katalogu</CardTitle>
            <CardDescription className="text-sm text-slate-200/80">
              Zarządzaj nagrodami dostępnymi dla dziecka. Możesz je dezaktywować lub edycję przeprowadzić w kreatorze.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="border-slate-800/60 bg-slate-900/50 text-white">
            <Link href="/onboarding/rewards">Dodaj nowe nagrody</Link>
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {rewards.length === 0 ? (
          <Card className="border-slate-800/60 bg-slate-900/40 text-slate-200/80">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Gift className="size-4 text-teal-200" aria-hidden />
                Brak nagród
              </CardTitle>
              <CardDescription className="text-sm">
                Dodaj nagrody z kreatora, aby dziecko mogło wymieniać punkty na przyjemności.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          rewards.map((reward) => {
            const source = resolveSource(reward.settings)
            const templateImage = typeof reward.settings?.imageUrl === "string" ? reward.settings.imageUrl : null

            return (
              <Card
                key={reward.id}
                className="flex flex-col gap-4 border-slate-800/60 bg-slate-900/40 p-4 text-slate-200"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={source.badgeVariant}>{source.label}</Badge>
                      {reward.isRepeatable ? (
                        <Badge variant="outline" className="border-emerald-400/60 text-emerald-200">
                          wielokrotna
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-700/60 text-slate-300">
                          jednorazowa
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{reward.name}</h3>
                    <p className="text-sm text-slate-300/80">{reward.description ?? "Brak opisu"}</p>
                    <p className="text-sm font-medium text-teal-200/90">Koszt: {reward.costPoints} pkt</p>
                  </div>
                  <div className="relative h-24 w-40 overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/70">
                    <RewardImage src={templateImage} alt={reward.name} />
                  </div>
                </div>

                <form action={toggleRewardActiveAction} className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm">
                  <input type="hidden" name="rewardId" value={reward.id} />
                  <input type="hidden" name="isActive" value={(!reward.isActive).toString()} />
                  <div className="flex items-center gap-2 text-slate-200/80">
                    {reward.isActive ? (
                      <ToggleRight className="size-4 text-emerald-300" aria-hidden />
                    ) : (
                      <ToggleLeft className="size-4 text-slate-500" aria-hidden />
                    )}
                    <span>{reward.isActive ? "Nagroda widoczna dla dziecka" : "Nagroda ukryta"}</span>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className={cn(
                      "min-w-[100px] transition-colors",
                      reward.isActive
                        ? "bg-white text-slate-950 hover:bg-slate-200 shadow-sm border-transparent font-medium"
                        : "bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    {reward.isActive ? "Dezaktywuj" : "Aktywuj"}
                  </Button>
                </form>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
