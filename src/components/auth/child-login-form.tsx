"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { AlertCircle, Loader2, QrCode, Shield } from "lucide-react"

import { loginChild } from "@/app/auth/child/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string }

const initialState: LoginState = { status: "idle" }

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Sprawdzanie tokenu…
        </>
      ) : (
        "Wejdź do rutyn"
      )}
    </Button>
  )
}

export function ChildLoginForm({ className }: { className?: string }) {
  const [state, formAction] = useActionState(loginChild, initialState)

  return (
    <Card className={cn("border-violet-500/40 bg-violet-950/40 text-violet-50 backdrop-blur", className)}>
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-semibold text-white">Witaj, bohaterze!</CardTitle>
        <CardDescription className="text-sm text-violet-100/90">
          Podaj token lub PIN otrzymany od rodzica. Token jest ważny przez 2 godziny i blokuje powrót do
          zadania po wylogowaniu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={formAction} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="token" className="text-sm font-medium text-white">
              Token dostępu (polecane)
            </label>
            <div className="relative flex items-center">
              <Input
                id="token"
                name="token"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="np. a1B2c3D4e5"
                className="pr-10"
                aria-describedby="token-help"
              />
              <QrCode className="pointer-events-none absolute right-3 size-4 text-violet-200/70" aria-hidden />
            </div>
            <p id="token-help" className="text-xs text-violet-100/80">
              Token możesz zeskanować z kodu QR lub wkleić ręcznie.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="pin" className="text-sm font-medium text-white">
                PIN (opcjonalnie)
              </label>
              <div className="inline-flex items-center gap-2 text-xs text-violet-100/80">
                <Shield className="size-3.5" aria-hidden />
                blokada po 5 próbach
              </div>
            </div>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              minLength={4}
              autoComplete="one-time-code"
              placeholder="••••"
            />
          </div>

          {state.status === "error" ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>{state.message}</p>
            </div>
          ) : null}

          <SubmitButton />
        </form>

        <p className="text-center text-xs text-violet-100/80">
          Nie masz tokenu? Poproś rodzica o wygenerowanie nowego w jego panelu.
        </p>
      </CardContent>
    </Card>
  )
}
