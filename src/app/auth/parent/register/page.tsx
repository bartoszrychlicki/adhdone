import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, MailCheck } from "lucide-react"

import { ParentRegisterForm } from "@/components/auth/parent-register-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveProfile } from "@/lib/auth/get-active-profile"

export const metadata: Metadata = {
  title: "Rejestracja rodzica",
  description: "Załóż konto rodzica i rozpocznij konfigurację rodziny w Dzienniku Rutyn.",
}

export default async function ParentRegisterPage() {
  const activeProfile = await getActiveProfile()

  if (activeProfile?.role === "parent" || activeProfile?.role === "admin") {
    redirect("/parent/dashboard")
  }

  if (activeProfile?.role === "child") {
    redirect("/child/home")
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <Link
            href="/auth/parent"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Wróć do logowania
          </Link>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Zacznij jako rodzic
            </h1>
            <p className="max-w-2xl text-base text-slate-200/80">
              Po rejestracji wyślemy do Ciebie wiadomość z linkiem potwierdzającym.
              Po potwierdzeniu przejdziesz bezpośrednio do kreatora konfiguracji rodziny.
            </p>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 text-sm text-slate-200/80">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full bg-indigo-500/20 p-2 text-indigo-200">
                  <MailCheck className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-slate-100">Potwierdzenie email jest wymagane</p>
                  <p>
                    Korzystamy z Supabase Auth. Jeżeli nie widzisz wiadomości,
                    sprawdź folder spam lub użyj opcji ponownej wysyłki po zalogowaniu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md flex-1">
          <ParentRegisterForm />
        </div>
      </div>

      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Co dalej?</CardTitle>
          <CardDescription className="text-sm text-slate-200/80">
            Po potwierdzeniu rejestracji zostaniesz automatycznie przeniesiony do kroku 1 kreatora.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-200/80">
          W każdej chwili możesz powrócić do kreatora z menu panelu rodzica.
        </CardContent>
      </Card>
    </div>
  )
}
