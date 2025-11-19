"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { AlertCircle, Loader2 } from "lucide-react"

import { signUpParent, type SignupState } from "@/app/auth/parent/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Rejestrowanie…
        </>
      ) : (
        "Załóż konto"
      )}
    </Button>
  )
}

const initialState: SignupState = { status: "idle" }

export function ParentRegisterForm({ className }: { className?: string }) {
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [state, formAction] = useActionState<SignupState, FormData>(signUpParent, initialState)

  return (
    <Card className={cn("border-slate-800/80 bg-slate-950/60 text-slate-100 backdrop-blur", className)}>
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-semibold">Stwórz konto rodzica</CardTitle>
        <CardDescription className="text-sm text-slate-200/80">
          Konto rodzica pozwoli Ci skonfigurować rutyny, dziecko i katalog nagród. Po rejestracji potwierdź
          adres email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={formAction} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-100">
              Adres email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="rodzic@example.com"
              aria-invalid={!!state.status && state.status === "error" && !!state.errors?.email}
              aria-describedby={state.status === "error" && state.errors?.email ? "email-error" : undefined}
            />
            {state.status === "error" && state.errors?.email && (
              <p id="email-error" className="text-sm text-red-400">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-100">
              Hasło
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              placeholder="Minimum 6 znaków"
              aria-invalid={!!state.status && state.status === "error" && !!state.errors?.password}
              aria-describedby={state.status === "error" && state.errors?.password ? "password-error" : undefined}
            />
            {state.status === "error" && state.errors?.password && (
              <p id="password-error" className="text-sm text-red-400">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-100">
              Powtórz hasło
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              placeholder="Powtórz hasło"
              aria-invalid={!!state.status && state.status === "error" && !!state.errors?.confirmPassword}
              aria-describedby={state.status === "error" && state.errors?.confirmPassword ? "confirmPassword-error" : undefined}
            />
            {state.status === "error" && state.errors?.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-red-400">
                {state.errors.confirmPassword[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 text-sm text-slate-200/80">
              <Checkbox
                id="acceptTerms"
                checked={acceptTerms}
                onCheckedChange={(value) => setAcceptTerms(value === true)}
                className="mt-1"
              />
              <div className="space-y-1">
                <label htmlFor="acceptTerms" className="font-medium text-white">
                  Akceptuję regulamin i politykę prywatności
                </label>
                <p>
                  Zgoda jest wymagana, aby utworzyć konto. Możesz ją wycofać, kontaktując się z nami w dowolnym
                  momencie.
                </p>
              </div>
            </div>
            {state.status === "error" && state.errors?.acceptTerms && (
              <p className="text-sm text-red-400">
                {state.errors.acceptTerms[0]}
              </p>
            )}
          </div>
          <input type="hidden" name="acceptTerms" value={acceptTerms ? "true" : "false"} />

          {state.status === "error" && !state.errors ? (
            <Alert variant="destructive" className="border-red-500/40 bg-red-500/10 text-red-100">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Rejestracja nie powiodła się</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <SubmitButton />
        </form>

        <p className="text-center text-xs text-slate-200/80">
          Masz już konto?{" "}
          <Link href="/auth/parent" className="font-medium text-white underline-offset-4 hover:underline">
            Zaloguj się
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
