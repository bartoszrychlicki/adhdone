import { notFound, redirect } from "next/navigation"

import type { Metadata } from "next"

import { RoutineSessionView } from "@/components/child/routine-session-view"
import { fetchChildRoutineSessionViewModelForChild } from "@/lib/child/queries"
import { createSupabaseServiceRoleClient } from "@/lib/supabase"
import { requireChildSession } from "@/lib/auth/child-session"

export const metadata: Metadata = {
  title: "Rutyna – szczegóły",
}

type RoutineSessionPageProps = {
  params: Promise<{
    sessionId: string
  }>
}

export default async function RoutineSessionPage({ params }: RoutineSessionPageProps) {
  const { sessionId } = await params
  const sessionContext = await requireChildSession()
  const supabase = createSupabaseServiceRoleClient()
  const session = await fetchChildRoutineSessionViewModelForChild(supabase, sessionId, sessionContext.childId)

  if (!session) {
    notFound()
  }

  if (session.childProfileId !== sessionContext.childId) {
    redirect("/child/routines")
  }

  return <RoutineSessionView session={session} sessionId={sessionId} />
}
