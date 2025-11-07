import type { Metadata } from "next"

import { fetchChildRewardsSnapshot } from "@/lib/child/queries"
import { createSupabaseServiceRoleClient } from "@/lib/supabase"
import { requireChildSession } from "@/lib/auth/child-session"
import { ChildRewardsGrid } from "@/components/child/rewards-grid"

export const metadata: Metadata = {
  title: "Nagrody dziecka",
  description: "Sprawdź dostępne nagrody i saldo punktów do wymiany.",
}

export default async function ChildRewardsPage() {
  const session = await requireChildSession()
  const supabase = createSupabaseServiceRoleClient()
  const snapshot = await fetchChildRewardsSnapshot(supabase, session.familyId, session.childId)
  const pointsBalance = snapshot.balance

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-violet-200/70">Sklep nagród</p>
        <h2 className="text-2xl font-semibold text-white">Na co chcesz wymienić punkty?</h2>
        <p className="text-sm text-violet-100/80">
          Aktualne saldo:{" "}
          <span className="font-semibold text-white">{pointsBalance} pkt</span>. Nagroda zostanie wysłana do rodzica do
          akceptacji.
        </p>
      </header>

      <ChildRewardsGrid
        rewards={snapshot.rewards}
        childId={session.childId}
        familyId={session.familyId}
        initialBalance={pointsBalance}
      />
    </div>
  )
}
