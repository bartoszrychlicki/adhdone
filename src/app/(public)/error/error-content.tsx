'use client'

import { useMemo } from "react"
import Link from "next/link"
import { AlertTriangle, LifeBuoy, WifiOff } from "lucide-react"

import { ErrorFallback } from "@/components/errors/error-fallback"
import { OfflineQueueStatus } from "@/components/errors/offline-queue-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ErrorInfoContent() {
  const lastSynced = useMemo(() => {
    const value = new Date()
    value.setMinutes(value.getMinutes() - 8)
    return value.toISOString()
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-12 text-white">
      <header className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-violet-200/80">Status systemu</p>
        <h1 className="text-3xl font-semibold">Wszystkie systemy działają stabilnie</h1>
        <p className="mx-auto max-w-2xl text-sm text-slate-200/80">
          Jeżeli któryś z widoków nie ładuje się poprawnie, skorzystaj z przycisku odświeżenia lub sprawdź nasze
          wskazówki dotyczące trybu offline.
        </p>
      </header>

      <ErrorFallback
        title="Problemy z widokiem?"
        description="Odśwież stronę lub wróć na ekran główny. Jeśli błąd się powtórzy, skontaktuj się z opiekunem."
        retryLabel="Odśwież stronę"
        onRetry={() => window.location.reload()}
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <WifiOff className="size-5 text-amber-300" aria-hidden />
              Wskazówki dotyczące trybu offline
            </div>
            <CardDescription className="text-sm text-slate-200/80">
              Aplikacja zapisuje postępy dziecka w kolejce lokalnej i synchronizuje je automatycznie po odzyskaniu
              połączenia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <OfflineQueueStatus pending={2} lastSyncedAt={lastSynced} onRetry={() => window.location.reload()} />
            <ul className="space-y-2 text-sm text-slate-200/80">
              <li className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-300" aria-hidden />
                Zakładka rutyny poinformuje Cię, gdy synchronizacja będzie wymagała ręcznego działania.
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-300" aria-hidden />
                W trybie offline wszystkie zadania są dostępne – pamiętaj o synchronizacji przed zamknięciem dnia.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
          <CardHeader className="space-y-3">
            <CardTitle className="text-lg font-semibold text-white">Potrzebujesz pomocy?</CardTitle>
            <CardDescription className="text-sm text-slate-200/80">
              Napisz do nas lub zajrzyj do przewodnika, w którym opisujemy najczęstsze sytuacje.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-slate-200/80">
            <Button asChild>
              <Link href="mailto:support@10xdevs.example">
                <LifeBuoy className="mr-2 size-4" aria-hidden />
                Kontakt ze wsparciem
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-slate-800/60 bg-slate-950/40 text-white">
              <Link href="/onboarding/family">Przewodnik po konfiguracji</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
