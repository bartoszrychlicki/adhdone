"use client"

import { useEffect, useRef, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react"
import Link from "next/link"

import { createChildProfileAction } from "@/app/onboarding/family/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ChildProfile = {
  id: string
  displayName: string
  createdAt: string
}

type ChildProfilesPanelProps = {
  familyId: string
  childrenProfiles: ChildProfile[]
  className?: string
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Dodawanie…
        </>
      ) : (
        "Dodaj dziecko"
      )}
    </Button>
  )
}

export function ChildProfilesPanel({ familyId, childrenProfiles, className }: ChildProfilesPanelProps) {
  const initialState = { status: "idle" as const }
  const [state, formAction] = useActionState(createChildProfileAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset()
    }
  }, [state.status])

  return (
    <section
      className={cn(
        "space-y-6 rounded-3xl border border-slate-800/60 bg-slate-900/40 p-6 text-slate-100 backdrop-blur",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Dzieci w Twojej rodzinie</h2>
          <p className="text-sm text-slate-200/80">
            Dodaj przynajmniej jedno dziecko. PIN możesz ustawić teraz lub po zakończeniu onboardingu.
          </p>
        </div>
        <Badge variant="outline" className="border-slate-700/60 bg-slate-900/60 text-xs text-slate-200">
          {childrenProfiles.length} / ∞
        </Badge>
      </div>

      <div className="space-y-4">
        {childrenProfiles.length === 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            <ShieldAlert className="size-4" aria-hidden />
            <p>
              Nie dodałeś jeszcze żadnego dziecka. Zrób to teraz, aby Eryk mógł zalogować się do swojej gry.
              Możesz wrócić po zakończeniu onboardingu, ale wtedy interfejs dziecka będzie niedostępny.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {childrenProfiles.map((child) => (
              <li
                key={child.id}
                className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 text-sm text-slate-200/90"
              >
                <p className="text-base font-semibold text-white">{child.displayName}</p>
                <p className="text-xs text-slate-300/70">
                  Utworzono {new Date(child.createdAt).toLocaleDateString("pl-PL", { dateStyle: "medium" })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form ref={formRef} action={formAction} className="space-y-5" noValidate>
        <input type="hidden" name="familyId" value={familyId} />
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-semibold text-white">
            Imię dziecka
          </label>
          <Input id="displayName" name="displayName" placeholder="np. Eryk" required />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="pin" className="text-sm font-semibold text-white">
              PIN (opcjonalnie)
            </label>
            <Link
              href="/parent/children"
              className="text-xs font-medium text-slate-200/90 underline-offset-4 hover:underline"
            >
              Zarządzaj PIN-ami w panelu
            </Link>
          </div>
          <Input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="4–6 cyfr"
          />
          <p className="text-xs text-slate-300/80">
            Jeśli zostawisz pole puste, wygenerujesz PIN później w sekcji „Dzieci”.
          </p>
        </div>

        {state.status === "error" ? (
          <Alert variant="destructive" className="border-red-500/40 bg-red-500/10 text-red-100">
            <AlertCircle className="size-4" aria-hidden />
            <AlertTitle>Nie udało się dodać dziecka</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        {state.status === "success" ? (
          <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100">
            <CheckCircle2 className="size-4" aria-hidden />
            <AlertTitle>Gotowe!</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SubmitButton />
          <p className="text-xs text-slate-300/80">
            Możesz dodać kolejne dzieci kiedy tylko zechcesz. Zawsze tylko jedno aktywne logowanie na dziecko.
          </p>
        </div>
      </form>
    </section>
  )
}
