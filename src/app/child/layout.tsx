import type { ReactNode } from "react"

import { AppShellChild } from "@/components/child/app-shell-child"
import { getChildWallet } from "@/app/api/_services/walletService"
import { createSupabaseServiceRoleClient } from "@/lib/supabase"
import { clearChildSession, requireChildSession } from "@/lib/auth/child-session"
import { redirect } from "next/navigation"

type ChildLayoutProps = {
  children: ReactNode
}

type FamilyRow = {
  family_name: string | null
}

export default async function ChildLayout({ children }: ChildLayoutProps) {
  const session = await requireChildSession()
  const supabase = createSupabaseServiceRoleClient()

  const { data: childProfile, error: childError } = await supabase
    .from("profiles")
    .select("id, display_name, family_id, deleted_at")
    .eq("id", session.childId)
    .maybeSingle()

  if (childError || !childProfile || childProfile.deleted_at) {
    await clearChildSession()
    redirect("/auth/child")
  }

  let pointsBalance = 0
  let familyName: string | null = null

  try {
    const wallet = await getChildWallet(supabase, session.familyId, session.childId, 0)
    pointsBalance = wallet.balance
  } catch (error) {
    console.warn("[ChildLayout] Failed to load wallet snapshot", error)
  }

  const { data: familyRow, error: familyError } = await supabase
    .from("families")
    .select("family_name")
    .eq("id", session.familyId)
    .maybeSingle<FamilyRow>()

  if (familyError) {
    console.warn("[ChildLayout] Failed to load family info", familyError)
  }

  familyName = familyRow?.family_name ?? null

  return (
    <AppShellChild
      childName={session.displayName}
      familyName={familyName}
      pointsBalance={pointsBalance}
    >
      {children}
    </AppShellChild>
  )
}
