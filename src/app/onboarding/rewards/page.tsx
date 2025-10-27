import Link from "next/link"
import { redirect } from "next/navigation"
import { Gift, PartyPopper } from "lucide-react"

import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { createSupabaseServerClient } from "@/lib/supabase"
import { REWARD_TEMPLATES } from "@/data/reward-templates"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RewardsSetupForm } from "./rewards-setup-form"

export default async function OnboardingRewardsPage() {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/parent")
  }

  if (!activeProfile.familyId) {
    throw new Error("Brak przypisanej rodziny. Uzupełnij poprzednie kroki.")
  }

  const supabase = await createSupabaseServerClient()

  const { data: existingRewards } = await supabase
    .from("rewards")
    .select("id, name, cost_points, settings")
    .eq("family_id", activeProfile.familyId)
    .is("deleted_at", null)

  const presetIds = new Set(
    (existingRewards ?? [])
      .map((reward) => {
        const settings = (reward.settings ?? {}) as { templateId?: string }
        return settings.templateId ?? null
      })
      .filter(Boolean) as string[]
  )

  return (
    <div className="flex flex-col gap-8 pb-20">
      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100 backdrop-blur">
        <CardHeader className="space-y-4">
          <Badge
            variant="outline"
            className="w-fit border-slate-700/60 bg-slate-900/60 text-xs uppercase tracking-wide text-slate-200"
          >
            Krok 3 z 3
          </Badge>
          <CardTitle className="text-2xl font-semibold">Stwórz pierwszy katalog nagród</CardTitle>
          <CardDescription className="text-sm text-slate-200/80">
            Wybierz nagrody startowe i dodaj własne pomysły. Dzieci zobaczą je w sklepie po zalogowaniu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RewardsSetupForm
            familyId={activeProfile.familyId}
            templates={REWARD_TEMPLATES}
            existingTemplateIds={presetIds}
          />
        </CardContent>
      </Card>

      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <PartyPopper className="size-5" aria-hidden />
            Gotowe do świętowania
          </CardTitle>
          <CardDescription className="text-sm text-slate-200/80">
            Po zapisaniu nagród wróć do panelu lub od razu przejdź na stronę dziecka, aby sprawdzić sklep.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-slate-200/80">
            <span className="mt-0.5 rounded-full bg-violet-500/20 p-2 text-violet-200">
              <Gift className="size-4" aria-hidden />
            </span>
            <p>
              Nagrody możesz później dezaktywować lub edytować w panelu rodzica → sekcja „Nagrody”.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-slate-800/60 bg-slate-900/60 text-white">
              <Link href="/parent/dashboard">Wróć do panelu</Link>
            </Button>
            <Button asChild>
              <Link href="/child/home">Zobacz sklep dziecka</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
