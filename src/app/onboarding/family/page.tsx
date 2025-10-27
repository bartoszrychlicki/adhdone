import Link from "next/link"
import { ArrowRight, Info } from "lucide-react"

import { ChildProfilesPanel } from "@/components/onboarding/child-profiles-panel"
import { FamilyDetailsForm } from "@/components/onboarding/family-details-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { getSupportedTimezones } from "@/lib/timezones"

type FamilyRecord = {
  id: string
  familyName: string
  timezone: string
}

type ChildProfileRecord = {
  id: string
  displayName: string
  createdAt: string
}

export default async function OnboardingFamilyPage() {
  const activeProfile = await getActiveProfile()

  if (!activeProfile || !activeProfile.familyId) {
    throw new Error("Brak przypisanej rodziny. Skontaktuj się z administratorem.")
  }

  const supabase = await createSupabaseServerClient()

  const [{ data: familyData, error: familyError }, { data: childrenData, error: childrenError }] =
    await Promise.all([
      supabase
        .from("families")
        .select("id, family_name, timezone")
        .eq("id", activeProfile.familyId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, display_name, created_at")
        .eq("family_id", activeProfile.familyId)
        .eq("role", "child")
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
    ])

  if (familyError || !familyData) {
    throw new Error("Nie udało się pobrać danych rodziny.")
  }

  if (childrenError) {
    throw new Error("Nie udało się pobrać listy dzieci.")
  }

  const family: FamilyRecord = {
    id: familyData.id,
    familyName: familyData.family_name ?? "Moja rodzina",
    timezone: familyData.timezone ?? "Europe/Warsaw",
  }

  const childProfiles: ChildProfileRecord[] =
    childrenData?.map((row) => ({
      id: row.id,
      displayName: row.display_name,
      createdAt: row.created_at,
    })) ?? []

  const timezoneOptions = getSupportedTimezones()

  return (
    <div className="flex flex-col gap-10 pb-20">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <FamilyDetailsForm
          familyId={family.id}
          defaultName={family.familyName}
          defaultTimezone={family.timezone}
          timezones={timezoneOptions}
        />
        <ChildProfilesPanel familyId={family.id} childrenProfiles={childProfiles} />
      </div>

      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-700/60 bg-slate-900/60 text-xs text-slate-200">
              Co dalej?
            </Badge>
            <CardTitle className="text-xl font-semibold text-white">Przygotuj się na krok 2</CardTitle>
          </div>
          <CardDescription className="text-sm text-slate-200/80">
            W kolejnym etapie wybierzesz ramy czasowe rutyn i skopiujesz zestaw zadań startowych.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-teal-500/20 p-2 text-teal-200">
              <Info className="size-4" aria-hidden />
            </span>
            <p>
              Możesz przejść dalej nawet jeśli nie dodałeś wszystkich dzieci. Zawsze wrócisz tu z poziomu panelu
              rodzica.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="ghost" className="border border-slate-800/60 bg-slate-950/40">
              <Link href="/">Zakończ i wróć</Link>
            </Button>
            <Button asChild size="lg" className="gap-2">
              <Link href="/onboarding/routines">
                Przejdź do kroku 2
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
