import { notFound, redirect } from "next/navigation"

import { RoutineSessionView } from "@/components/child/routine-session-view"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { fetchChildRoutineSessionViewModel } from "@/lib/child/queries"
import { createSupabaseServerClient } from "@/lib/supabase"

type RoutineSessionPageProps = {
  params: Promise<{
    sessionId: string
  }>
}

export default async function RoutineSessionPage({ params }: RoutineSessionPageProps) {
  const { sessionId } = await params
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/child")
  }

  if (activeProfile.role !== "child") {
    redirect("/parent/dashboard")
  }

  const supabase = await createSupabaseServerClient()
  const session = await fetchChildRoutineSessionViewModel(supabase, sessionId).catch(() => null)

  if (!session) {
    notFound()
  }

  if (session.childProfileId !== activeProfile.id) {
    redirect("/child/home")
  }

  return <RoutineSessionView session={session} sessionId={sessionId} />
}
