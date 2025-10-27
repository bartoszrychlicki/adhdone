'use client'

import Link from "next/link"
import { useEffect } from "react"
import { AlertTriangle, Home, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ErrorFallbackProps = {
  title?: string
  description?: string
  retryLabel?: string
  onRetry?: () => void
  supportHref?: string
  className?: string
  digest?: string
}

export function ErrorFallback({
  title = "Coś poszło nie tak",
  description = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie albo wróć na stronę główną.",
  retryLabel = "Spróbuj ponownie",
  onRetry,
  supportHref,
  className,
  digest,
}: ErrorFallbackProps) {
  useEffect(() => {
    if (digest) {
      console.error(`[ErrorFallback] digest=${digest}`)
    }
  }, [digest])

  return (
    <Card className={cn("mx-auto w-full max-w-2xl border-red-500/40 bg-red-500/10 text-red-50", className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border border-red-500/60 bg-red-500/20">
            <AlertTriangle className="size-5 text-red-200" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-white">{title}</CardTitle>
            <CardDescription className="text-sm text-red-100/90">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-red-100/80">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className="inline-flex items-center gap-2 bg-white/20 text-white hover:bg-white/30"
          onClick={onRetry}
          disabled={!onRetry}
        >
          <RefreshCcw className="size-4" aria-hidden />
          {retryLabel}
        </Button>
          <Button
            type="button"
            variant="outline"
            className="inline-flex items-center gap-2 border-white/40 text-white"
            asChild
          >
            <Link href="/">
              <Home className="size-4" aria-hidden />
              Strona główna
            </Link>
          </Button>
          {supportHref ? (
            <Button
              type="button"
              variant="ghost"
              className="inline-flex items-center gap-2 border border-white/30 bg-red-500/20 text-white hover:bg-red-500/30"
              asChild
            >
              <Link href={supportHref}>Kontakt ze wsparciem</Link>
            </Button>
          ) : null}
        </div>
        {digest ? (
          <p className="text-xs text-red-200/70">Identyfikator błędu: {digest}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
