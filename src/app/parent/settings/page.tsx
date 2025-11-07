import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { FamilySettingsForm } from "./family-settings-form"
import {
  defaultNotificationPreferences,
  extractNotificationPreferences,
  type NotificationPreferences,
} from "./notification-preferences"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { createSupabaseServerClient } from "@/lib/supabase"
import { getSupportedTimezones } from "@/lib/timezones"

type OnboardingSettings = {
  completedSteps?: unknown
  isComplete?: unknown
}

type FamilySettingsRecord = {
  onboarding: {
    isComplete: boolean
    completedSteps: string[]
  }
  notifications: NotificationPreferences
  raw: Record<string, unknown>
}

function normalizeOnboarding(settings: OnboardingSettings): { isComplete: boolean; completedSteps: string[] } {
  const completedStepsRaw = Array.isArray(settings.completedSteps) ? settings.completedSteps : []
  const completedSteps = completedStepsRaw.filter((step): step is string => typeof step === "string")

  return {
    isComplete: settings.isComplete === true,
    completedSteps,
  }
}

function mapFamilySettings(settings: Record<string, unknown> | null): FamilySettingsRecord {
  const rawSettings = settings ?? {}
  const onboardingRaw =
    typeof rawSettings.onboarding === "object" && rawSettings.onboarding !== null
      ? (rawSettings.onboarding as OnboardingSettings)
      : {}

  return {
    raw: { ...rawSettings },
    notifications: extractNotificationPreferences(rawSettings),
    onboarding: normalizeOnboarding(onboardingRaw),
  }
}

export const metadata: Metadata = {
  title: "Ustawienia rodziny",
  description: "Zarządzaj nazwą rodziny, strefą czasową i powiadomieniami.",
}

export default async function ParentSettingsPage() {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/parent")
  }

  if (activeProfile.role === "child") {
    redirect("/child/routines")
  }

  if (!activeProfile.familyId) {
    throw new Error("Brak przypisanej rodziny.")
  }

  const supabase = await createSupabaseServerClient()

  const { data: familyData, error } = await supabase
    .from("families")
    .select("id, family_name, timezone, settings, updated_at")
    .eq("id", activeProfile.familyId)
    .maybeSingle()

  if (error || !familyData) {
    console.error("[ParentSettingsPage] Failed to load family settings", error)
    throw new Error("Nie udało się pobrać ustawień rodziny.")
  }

  const settings = mapFamilySettings(familyData.settings as Record<string, unknown> | null)
  const timezoneOptions = getSupportedTimezones()

  return (
    <div className="flex flex-col gap-6 pb-16">
      <FamilySettingsForm
        familyId={familyData.id}
        defaultName={familyData.family_name ?? "Moja rodzina"}
        defaultTimezone={familyData.timezone ?? "Europe/Warsaw"}
        timezones={timezoneOptions}
        initialSettings={settings.raw}
        defaultNotifications={settings.notifications ?? defaultNotificationPreferences}
        onboarding={settings.onboarding}
        defaultUpdatedAt={familyData.updated_at}
      />
    </div>
  )
}
