import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, Sparkles } from "lucide-react"

import { ChildLoginForm } from "@/components/auth/child-login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveProfile } from "@/lib/auth/get-active-profile"

type ChildLoginPageProps = {
  searchParams: Promise<{ childId?: string }>
}

export const metadata: Metadata = {
  title: "Logowanie dziecka",
  description: "Wpisz PIN otrzymany od rodzica, aby wejść do Dziennika Rutyn.",
}

export default async function ChildLoginPage({ searchParams }: ChildLoginPageProps) {
  const params = await searchParams
  const defaultChildId = typeof params.childId === "string" ? params.childId : undefined
  const activeProfile = await getActiveProfile()

  if (activeProfile?.role === "child") {
    redirect("/child/home")
  }

  if (activeProfile?.role === "parent" || activeProfile?.role === "admin") {
    redirect("/parent/dashboard")
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-200 transition hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Wróć do wyboru roli
          </Link>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Gotowy na kolejną przygodę?
            </h1>
            <p className="max-w-2xl text-base text-violet-100/80">
              Otworzyliśmy link od rodzica. Aby rozpocząć, wpisz PIN, który od niego otrzymałeś.
            </p>
            <div className="rounded-xl border border-violet-500/30 bg-violet-900/30 p-4 text-sm text-violet-100/90">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full bg-fuchsia-500/20 p-2 text-fuchsia-200">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-white">Twoje postępy są bezpieczne</p>
                  <p>
                    Po wylogowaniu wrócisz dokładnie do miejsca, w którym skończyłeś. Rodzic widzi wszystkie
                    rutyny w panelu i może nagrodzić Cię za regularność.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md flex-1">
          <ChildLoginForm defaultChildId={defaultChildId} />
        </div>
      </div>

      <Card className="border-violet-500/40 bg-violet-900/30 text-violet-50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Nie pamiętasz PIN-u?</CardTitle>
          <CardDescription className="text-sm text-violet-100/80">
            Rodzic może w dowolnym momencie ustawić nowy PIN w swoim panelu w sekcji „Dzieci”.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-violet-100/90">
          <p>Jeśli wpiszesz PIN błędnie kilka razy, poproś rodzica o jego odświeżenie i spróbuj ponownie.</p>
        </CardContent>
      </Card>
    </div>
  )
}
