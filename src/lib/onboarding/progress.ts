import { createSupabaseServiceRoleClient } from "@/lib/supabase"
import { getOnboardingState, updateOnboardingState } from "@/app/api/_services/onboardingService"

export type OnboardingStep = "family" | "routines" | "rewards"

export async function markOnboardingProgress({
  profileId,
  familyId,
  profileStep,
  familyStep,
  markComplete = false,
}: {
  profileId: string
  familyId: string
  profileStep?: OnboardingStep
  familyStep?: OnboardingStep
  markComplete?: boolean
}) {
  const supabase = createSupabaseServiceRoleClient()
  const state = await getOnboardingState(supabase, profileId, familyId)

  const profileSteps = new Set(state.profile.completedSteps ?? [])
  const familySteps = new Set(state.family.completedSteps ?? [])

  if (profileStep) {
    profileSteps.add(profileStep)
  }

  if (familyStep) {
    familySteps.add(familyStep)
  }

  const payload = {
    profileSteps: profileSteps.size > 0 ? Array.from(profileSteps) : undefined,
    familySteps: familySteps.size > 0 ? Array.from(familySteps) : undefined,
    isComplete: markComplete ? true : state.profile.isComplete && state.family.isComplete,
  }

  await updateOnboardingState(supabase, profileId, familyId, payload)
}

export const ONBOARDING_STEPS: Record<string, OnboardingStep> = {
  family: "family",
  routines: "routines",
  rewards: "rewards",
}
