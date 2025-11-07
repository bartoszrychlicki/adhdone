import Link from "next/link"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { NetworkStatusBanner } from "@/components/network-status-banner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getActiveProfile } from "@/lib/auth/get-active-profile"

type OnboardingLayoutProps = {
  children: ReactNode
}

const steps = [
  { label: "Rodzina i dzieci", href: "/onboarding/family", step: 1 },
  { label: "Rutyny i zadania", href: "/onboarding/routines", step: 2 },
  { label: "Nagrody startowe", href: "/onboarding/rewards", step: 3 },
] as const

export default async function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/parent")
  }

  if (activeProfile.role === "child") {
    redirect("/child/routines")
  }

  if (activeProfile.role !== "parent" && activeProfile.role !== "admin") {
    redirect("/auth/parent")
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(192,132,252,0.12),transparent_55%)]" />
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="space-y-1">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Dziennik Rutyn Eryka
          </Link>
          <p className="text-xs uppercase tracking-wide text-slate-300/80">
            Konfiguracja rodziny • krok po kroku
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-slate-200 hover:text-white">
          <Link href="/parent/dashboard">Przejdź do panelu</Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 sm:gap-12 sm:px-10">
        <NetworkStatusBanner />
        <section className="rounded-3xl border border-slate-800/60 bg-slate-900/40 p-6 text-slate-100 backdrop-blur">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="border-slate-700/60 bg-slate-900/60 text-xs uppercase tracking-wide text-slate-200"
              >
                Onboarding
              </Badge>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                Skonfiguruj środowisko dla Eryka
              </h1>
              <p className="max-w-2xl text-sm text-slate-200/80">
                Przejdź przez trzy kroki, aby przygotować rutyny, pierwsze zadania i katalog nagród. Wszystkie
                ustawienia możesz później zmienić w panelu rodzica.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-slate-200/80 sm:text-right">
              <span className="font-medium text-white">Zalogowany jako: {activeProfile.displayName}</span>
            </div>
          </div>

          <nav className="mt-8 grid gap-3 sm:grid-cols-3">
            {steps.map((stepInfo) => (
              <Link
                key={stepInfo.step}
                href={stepInfo.href}
                className="group flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-900/50 px-4 py-3 text-sm transition hover:border-slate-200/60 hover:bg-slate-900/70"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full border border-slate-800 bg-slate-950/70 font-semibold text-slate-300 transition group-hover:border-slate-200 group-hover:text-white">
                    {stepInfo.step}
                  </span>
                  <span className="font-medium text-white transition group-hover:text-teal-200">
                    {stepInfo.label}
                  </span>
                </div>
                <span aria-hidden className="text-xs uppercase tracking-wide text-slate-500 group-hover:text-slate-200">
                  Krok {stepInfo.step} z 3
                </span>
              </Link>
            ))}
          </nav>
        </section>

        {children}
      </main>
    </div>
  )
}
