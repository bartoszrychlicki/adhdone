'use client'

import { useEffect } from "react"

import { ErrorFallback } from "@/components/errors/error-fallback"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <html lang="pl">
      <body className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <ErrorFallback
            title="Wystąpił błąd aplikacji"
            description="Nie mogliśmy załadować widoku. Kliknij poniżej, aby spróbować ponownie lub wróć na ekran główny."
            retryLabel="Odśwież widok"
            onRetry={reset}
            digest={error.digest}
            supportHref="mailto:support@10xdevs.example"
          />
        </div>
      </body>
    </html>
  )
}
