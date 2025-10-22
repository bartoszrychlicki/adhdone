import Link from "next/link"
import type { ReactNode } from "react"

import { NetworkStatusBanner } from "@/components/network-status-banner"
import { Button } from "@/components/ui/button"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.15),transparent_55%)]" />
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Dziennik Rutyn Eryka
        </Link>
        <Button asChild variant="ghost" size="sm" className="text-slate-200 hover:text-white">
          <Link href="/">Powrót</Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-16 sm:gap-12 sm:px-10">
        <NetworkStatusBanner />
        {children}
      </main>
    </div>
  )
}
