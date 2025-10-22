"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { AlertCircle, Loader2 } from "lucide-react"

import { loginParent } from "@/app/auth/parent/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type LoginState =
  | { status: "idle" }
  | {
      status: "error"
      message: string
    }

const initialState: LoginState = { status: "idle" }

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Logowanie…
        </>
      ) : (
        "Zaloguj się"
      )}
    </Button>
  )
}

export function ParentLoginForm({ className }: { className?: string }) {
  const [state, formAction] = useActionState(loginParent, initialState)

  return (
    <Card className={cn("border-slate-800/80 bg-slate-950/60 text-slate-100 backdrop-blur", className)}>
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-semibold">Panel rodzica</CardTitle>
        <CardDescription className="text-sm text-slate-200/80">
          Użyj adresu email i hasła utworzonych podczas konfiguracji konta rodzica.
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
              placeholder="rodzic@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-100">
                Hasło
              </label>
              <Link
                href="/auth/parent/reset"
                className="text-xs font-medium text-slate-200 underline-offset-4 hover:underline"
              >
                Zapomniałeś hasła?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              minLength={6}
              required
            />
          </div>

          {state.status === "error" ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>{state.message}</p>
            </div>
          ) : null}

          <SubmitButton />
        </form>

        <p className="text-center text-xs text-slate-200/80">
          Potrzebujesz konta?{" "}
          <Link href="/auth/parent/register" className="font-medium text-white underline-offset-4 hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
