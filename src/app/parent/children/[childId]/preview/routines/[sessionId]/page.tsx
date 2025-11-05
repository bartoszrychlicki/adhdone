import { notFound, redirect } from "next/navigation"

import { AppShellChild } from "@/components/child/app-shell-child"
import { RoutineSessionView } from "@/components/child/routine-session-view"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { fetchChildRewardsSnapshot, fetchChildRoutineSessionViewModel } from "@/lib/child/queries"
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase"

type PreviewRoutinePageProps = {
  params: Promise<{
    childId: string
    sessionId: string
  }>
}

export default async function ParentChildRoutinePreviewPage({ params }: PreviewRoutinePageProps) {
  const { childId, sessionId } = await params
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/parent")
  }

  if (activeProfile.role === "child") {
    redirect(`/child/routines/${sessionId}`)
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

  let session = await fetchChildRoutineSessionViewModel(supabase, sessionId).catch(() => null)

  if (!session || session.childProfileId !== childProfile.id) {
    try {
      const serviceClient = createSupabaseServiceRoleClient()
      session = await fetchChildRoutineSessionViewModel(serviceClient, sessionId).catch(() => null)
    } catch (error) {
      console.warn("[ParentChildRoutinePreviewPage] Service role fallback failed", error)
      session = null
    }

    if (!session || session.childProfileId !== childProfile.id) {
      notFound()
    }
  }

  const [{ data: family }, rewardsSnapshot] = await Promise.all([
    supabase.from("families").select("family_name").eq("id", activeProfile.familyId).maybeSingle(),
    fetchChildRewardsSnapshot(supabase, activeProfile.familyId, childProfile.id),
  ])

  const familyName = family?.family_name ?? "Twoja rodzina"

  return (
    <AppShellChild
      childName={childProfile.display_name}
      familyName={familyName}
      pointsBalance={rewardsSnapshot.balance}
      returnHref={`/parent/children/${childProfile.id}/preview`}
    >
      <RoutineSessionView session={session} sessionId={sessionId} />
    </AppShellChild>
  )
}
