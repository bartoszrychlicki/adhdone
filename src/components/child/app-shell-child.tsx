import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"

import { OfflineBanner } from "./offline-banner"
import { PointsBadge } from "./points-badge"
import { ChildNav } from "./child-nav"
import { Button } from "@/components/ui/button"

type AppShellChildProps = {
  childName: string
  familyName?: string | null
  pointsBalance: number
  returnHref?: string
  children: ReactNode
}

export function AppShellChild({
  childName,
  familyName,
  pointsBalance,
  returnHref = "/auth/child/logout",
  children,
}: AppShellChildProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-violet-950 via-slate-950 to-slate-950 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.45),transparent_70%)]" />
      <header className="px-5 pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-violet-200/70">
              {familyName ? `Rodzina ${familyName}` : "Twoja rodzina"}
            </div>
            <h1 className="text-3xl font-semibold text-white">Hej, {childName}!</h1>
            <p className="text-sm text-violet-100/80">Masz energię, by sięgnąć po kolejne odznaki. Powodzenia!</p>
            <PointsBadge points={pointsBalance} href="/child/rewards" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="border border-violet-600/60 bg-violet-900/30 text-violet-100 hover:bg-violet-900/60"
            asChild
          >
            <Link href={returnHref}>
              <ArrowLeft className="size-4" aria-hidden />
              <span className="text-xs">Zmień rolę</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="px-5 pt-6">
        <OfflineBanner />
      </div>

      <main className="relative z-10 flex min-h-[60vh] flex-col px-5 pb-28 pt-6 text-base text-white">
        {children}
      </main>

      <ChildNav />
    </div>
  )
}
