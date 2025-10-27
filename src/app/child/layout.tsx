import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { AppShellChild } from "@/components/child/app-shell-child"
import { getChildWallet } from "@/app/api/_services/walletService"
import { createSupabaseServerClient } from "@/lib/supabase"
import { getActiveProfile } from "@/lib/auth/get-active-profile"

type ChildLayoutProps = {
  children: ReactNode
}

type FamilyRow = {
  family_name: string | null
}

export default async function ChildLayout({ children }: ChildLayoutProps) {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/child")
  }

  if (activeProfile.role !== "child") {
    redirect("/parent/dashboard")
  }

  const supabase = await createSupabaseServerClient()
  let pointsBalance = 0
  let familyName: string | null = null

  if (activeProfile.familyId) {
    try {
      const wallet = await getChildWallet(supabase, activeProfile.familyId, activeProfile.id, 0)
      pointsBalance = wallet.balance
    } catch (error) {
      console.warn("[ChildLayout] Failed to load wallet snapshot", error)
    }

    const familyResult = await supabase
      .from("families")
      .select("family_name")
      .eq("id", activeProfile.familyId)
      .maybeSingle<FamilyRow>()

    if (familyResult.error) {
      console.warn("[ChildLayout] Failed to load family info", familyResult.error)
    }

    familyName = familyResult.data?.family_name ?? null
  }

  return (
    <AppShellChild
      childName={activeProfile.displayName}
      familyName={familyName}
      pointsBalance={pointsBalance}
      returnHref="/"
    >
      {children}
    </AppShellChild>
  )
}
