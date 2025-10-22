"use client"

import { useEffect, useMemo, useRef, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react"

import { updateFamilyAction } from "@/app/onboarding/family/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type FamilyDetailsFormProps = {
  familyId: string
  defaultName: string
  defaultTimezone: string
  timezones: string[]
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Zapisywanie…
        </>
      ) : (
        "Zapisz dane rodziny"
      )}
    </Button>
  )
}

export function FamilyDetailsForm({
  familyId,
  defaultName,
  defaultTimezone,
  timezones,
}: FamilyDetailsFormProps) {
  const initialState = { status: "idle" as const }
  const [state, formAction] = useActionState(updateFamilyAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  const timezoneOptions = useMemo(() => {
    const preferred = ["Europe/Warsaw", "Europe/Berlin", "Europe/London", "UTC"]
    const unique = new Set<string>()
    const ordered: string[] = []

    preferred.forEach((zone) => {
      if (timezones.includes(zone) && !unique.has(zone)) {
        unique.add(zone)
        ordered.push(zone)
      }
    })

    timezones.forEach((zone) => {
      if (!unique.has(zone)) {
        unique.add(zone)
        ordered.push(zone)
      }
    })

    return ordered
  }, [timezones])

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset()
    }
  }, [state.status])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-3xl border border-slate-800/60 bg-slate-900/40 p-6 text-slate-100 backdrop-blur"
    >
      <input type="hidden" name="familyId" value={familyId} />
      <div className="space-y-2">
        <label htmlFor="familyName" className="text-sm font-semibold text-white">
          Nazwa rodziny
        </label>
        <Input
          id="familyName"
          name="familyName"
          defaultValue={defaultName}
          placeholder="np. Drużyna Kowalskich"
          required
        />
        <p className="text-xs text-slate-300/80">
          Nazwa pojawia się na ekranie dziecka oraz w powiadomieniach email.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="timezone" className="text-sm font-semibold text-white">
          Strefa czasowa
        </label>
        <div className="relative">
          <select
            id="timezone"
            name="timezone"
            defaultValue={defaultTimezone}
            className="w-full rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white shadow-sm outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-400/40"
            required
          >
            {timezoneOptions.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-300/80">
          Rutyny poranne, popołudniowe i wieczorne będą dopasowane do tej strefy.
        </p>
      </div>

      {state.status === "error" ? (
        <Alert variant="destructive" className="border-red-500/40 bg-red-500/10 text-red-100">
          <TriangleAlert className="size-4" aria-hidden />
          <AlertTitle>Nie udało się zapisać</AlertTitle>
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
          Możesz wrócić do tego kroku później. Wszystkie zmiany są zapisywane po kliknięciu „Zapisz”.
        </p>
      </div>
    </form>
  )
}
