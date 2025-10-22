import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"

import { ChildLoginForm } from "@/components/auth/child-login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveProfile } from "@/lib/auth/get-active-profile"

export default async function ChildLoginPage() {
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
              Token działa jak magiczne przejście prosto do Twoich rutyn. Jeśli go nie masz, poproś rodzica o
              szybkie wygenerowanie nowego kodu QR lub PIN-u.
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
          <ChildLoginForm />
        </div>
      </div>

      <Card className="border-violet-500/40 bg-violet-900/30 text-violet-50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Jak zdobyć token?</CardTitle>
          <CardDescription className="text-sm text-violet-100/80">
            Rodzic generuje nowy token w panelu w sekcji „Dzieci”. Możesz zeskanować kod QR albo przepisać
            ciąg znaków.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-violet-100/90">
          <p>
            Token wygasa po dwóch godzinach, ale możesz poprosić rodzica o wygenerowanie kolejnego. Jeśli
            kilka razy wpiszesz zły PIN, po prostu poproś o odblokowanie konta.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
