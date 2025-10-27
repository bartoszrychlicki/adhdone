"use client"

import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useFormStatus } from "react-dom"
import { AlertCircle, Bell, CalendarClock, CheckCircle2, Loader2, MapPin, ShieldAlert } from "lucide-react"

import { updateFamilySettingsAction, type UpdateFamilySettingsState } from "./actions"
import { extractNotificationPreferences, type NotificationPreferences } from "./notification-preferences"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type OnboardingStatus = {
  isComplete: boolean
  completedSteps: string[]
}

type FamilySettingsFormProps = {
  familyId: string
  defaultName: string
  defaultTimezone: string
  timezones: string[]
  initialSettings: Record<string, unknown>
  defaultNotifications: NotificationPreferences
  onboarding: OnboardingStatus
  defaultUpdatedAt?: string | null
}

const notificationDefinitions: Array<{
  key: keyof NotificationPreferences
  title: string
  description: string
  icon: ReactNode
}> = [
  {
    key: "routineReminders",
    title: "Powiadomienia o rutynach",
    description: "Email do rodzica 15 minut przed startem porannej, popołudniowej i wieczornej rutyny.",
    icon: <CalendarClock className="size-4 text-teal-200" aria-hidden />,
  },
  {
    key: "rewardRedemptions",
    title: "Prośby o nagrody",
    description: "Alert push/email gdy dziecko wymieni punkty na nagrodę i czeka na akceptację.",
    icon: <Bell className="size-4 text-indigo-200" aria-hidden />,
  },
  {
    key: "weeklySummary",
    title: "Tygodniowe podsumowanie",
    description: "Raport postępów, serii i zdobytych odznak wysyłany w niedzielny wieczór.",
    icon: <CheckCircle2 className="size-4 text-emerald-200" aria-hidden />,
  },
]

const initialActionState: UpdateFamilySettingsState = { status: "idle" }

function SaveButton({
  onRequestSubmit,
  disabled,
}: {
  onRequestSubmit: () => void
  disabled: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="button"
      size="lg"
      className="w-full sm:w-auto"
      onClick={onRequestSubmit}
      disabled={disabled || pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Zapisywanie…
        </>
      ) : (
        "Zapisz zmiany"
      )}
    </Button>
  )
}

export function FamilySettingsForm({
  familyId,
  defaultName,
  defaultTimezone,
  timezones,
  initialSettings,
  defaultNotifications,
  onboarding,
  defaultUpdatedAt,
}: FamilySettingsFormProps) {
  const [state, formAction] = useActionState(updateFamilySettingsAction, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)

  const [familyName, setFamilyName] = useState(defaultName)
  const [timezone, setTimezone] = useState(defaultTimezone)
  const [notifications, setNotifications] = useState<NotificationPreferences>({ ...defaultNotifications })
  const [settingsBase, setSettingsBase] = useState<Record<string, unknown>>({ ...initialSettings })
  const [baseline, setBaseline] = useState<{
    familyName: string
    timezone: string
    notifications: NotificationPreferences
  }>({
    familyName: defaultName,
    timezone: defaultTimezone,
    notifications: { ...defaultNotifications },
  })
  const [hasConfirmedTimezone, setHasConfirmedTimezone] = useState(false)
  const [timezoneDialogOpen, setTimezoneDialogOpen] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(defaultUpdatedAt ?? null)

  const settingsPayload = useMemo(() => {
    return JSON.stringify({
      ...settingsBase,
      notifications: {
        routineReminders: notifications.routineReminders,
        rewardRedemptions: notifications.rewardRedemptions,
        weeklySummary: notifications.weeklySummary,
      },
    })
  }, [notifications.rewardRedemptions, notifications.routineReminders, notifications.weeklySummary, settingsBase])

  const isDirty = useMemo(() => {
    if (familyName.trim() !== baseline.familyName.trim()) {
      return true
    }

    if (timezone !== baseline.timezone) {
      return true
    }

    return (
      notifications.routineReminders !== baseline.notifications.routineReminders ||
      notifications.rewardRedemptions !== baseline.notifications.rewardRedemptions ||
      notifications.weeklySummary !== baseline.notifications.weeklySummary
    )
  }, [baseline.familyName, baseline.notifications.rewardRedemptions, baseline.notifications.routineReminders, baseline.notifications.weeklySummary, baseline.timezone, familyName, notifications.rewardRedemptions, notifications.routineReminders, notifications.weeklySummary, timezone])

  const timezoneChanged = timezone !== baseline.timezone

  useEffect(() => {
    if (state.status === "success") {
      const updatedSettings = (state.data.settings ?? {}) as Record<string, unknown>
      const nextNotifications = extractNotificationPreferences(updatedSettings)

      setFamilyName(state.data.familyName)
      setTimezone(state.data.timezone)
      setNotifications(nextNotifications)
      setSettingsBase({ ...updatedSettings })
      setBaseline({
        familyName: state.data.familyName,
        timezone: state.data.timezone,
        notifications: nextNotifications,
      })
      setLastSavedAt(state.data.updatedAt ?? new Date().toISOString())
      setHasConfirmedTimezone(false)
      setTimezoneDialogOpen(false)
    }

    if (state.status === "error") {
      setHasConfirmedTimezone(false)
    }
  }, [state])

  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) {
      return null
    }

    try {
      return new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(lastSavedAt))
    } catch {
      return new Date(lastSavedAt).toLocaleString("pl-PL")
    }
  }, [lastSavedAt])

  function handleSubmitRequest() {
    if (!isDirty) {
      return
    }

    if (!hasConfirmedTimezone && timezoneChanged) {
      setTimezoneDialogOpen(true)
      return
    }

    submitForm()
  }

  function submitForm() {
    if (!formRef.current) {
      return
    }

    formRef.current.requestSubmit()
  }

  function handleConfirmTimezone() {
    setHasConfirmedTimezone(true)
    setTimezoneDialogOpen(false)
    setTimeout(() => {
      submitForm()
    }, 0)
  }

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="space-y-8 rounded-3xl border border-slate-800/60 bg-slate-900/40 p-6 text-slate-100 backdrop-blur"
        noValidate
      >
        <input type="hidden" name="familyId" value={familyId} />
        <input type="hidden" name="settings" value={settingsPayload} />

        <header className="flex flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-300/70">
              <Badge variant={onboarding.isComplete ? "outline" : "default"} className="border-teal-500/40 bg-teal-500/15 text-teal-100">
                {onboarding.isComplete ? "Onboarding zakończony" : "Onboarding w toku"}
              </Badge>
              {lastSavedLabel ? <span>Ostatnia aktualizacja: {lastSavedLabel}</span> : null}
            </div>
            <h2 className="text-2xl font-semibold text-white">Informacje o rodzinie</h2>
            <p className="text-sm text-slate-200/80">
              Zmień nazwę wyświetlaną w aplikacji dziecka oraz dostosuj powiadomienia wysyłane do opiekunów.
            </p>
          </div>
          <div className="hidden text-right text-xs text-slate-300/70 sm:block">
            {onboarding.completedSteps.length > 0 ? (
              <span>Ukończone kroki: {onboarding.completedSteps.length}</span>
            ) : (
              <span>Przypisanych kroków: brak danych</span>
            )}
          </div>
        </header>

        <section className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="familyName" className="text-sm font-semibold text-white">
              Nazwa rodziny
            </label>
            <Input
              id="familyName"
              name="familyName"
              value={familyName}
              onChange={(event) => setFamilyName(event.target.value)}
              placeholder="np. Drużyna Kowalskich"
              required
            />
            <p className="text-xs text-slate-300/80">Nazwa pojawia się na ekranach dziecka i w powiadomieniach email.</p>
          </div>

          <div className="space-y-3">
            <label htmlFor="timezone" className="flex items-center gap-2 text-sm font-semibold text-white">
              <MapPin className="size-4 text-teal-200" aria-hidden />
              Strefa czasowa rodziny
            </label>
            <div className="relative">
              <select
                id="timezone"
                name="timezone"
                value={timezone}
                onChange={(event) => {
                  setTimezone(event.target.value)
                  setHasConfirmedTimezone(false)
                }}
                className={cn(
                  "w-full rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white shadow-sm outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-400/40",
                  timezoneChanged ? "border-amber-400/70 bg-amber-950/40" : ""
                )}
                required
              >
                {timezones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-300/80">
              Godziny rutyn i przypomnienia będą dopasowane do wskazanej strefy. Zmiana wpłynie na harmonogram dnia.
            </p>
            {timezoneChanged ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-100">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p>
                  Pamiętaj, że po zapisaniu zmiany wszystkie przyszłe rutyny zostaną przesunięte do nowego czasu
                  lokalnego. Dziecko zobaczy korektę po następnym odświeżeniu aplikacji.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Powiadomienia opiekuna</h3>
              <p className="text-sm text-slate-300/80">
                Wybierz, które powiadomienia mailowe i push mają docierać do rodziców.
              </p>
            </div>
            <Badge variant="outline" className="border-slate-700/60 bg-slate-900/60 text-xs text-slate-200">
              Personalizacja
            </Badge>
          </div>

          <div className="grid gap-4">
            {notificationDefinitions.map((definition) => {
              const checked = notifications[definition.key]

              return (
                <div
                  key={definition.key}
                  className={cn(
                    "flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between",
                    checked ? "border-teal-500/40" : ""
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      {definition.icon}
                      {definition.title}
                    </div>
                    <p className="text-sm text-slate-300/80">{definition.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      {checked ? "Włączone" : "Wyłączone"}
                    </span>
                    <Switch
                      checked={checked}
                      onCheckedChange={(value) =>
                        setNotifications((prev) =>
                          ({
                            ...prev,
                            [definition.key]: value,
                          }) as NotificationPreferences
                        )
                      }
                      aria-label={definition.title}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {state.status === "error" ? (
          <Alert variant="destructive" className="border-red-500/40 bg-red-500/10 text-red-100">
            <AlertCircle className="size-4" aria-hidden />
            <AlertTitle>Nie udało się zapisać zmian</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        {state.status === "success" ? (
          <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100">
            <CheckCircle2 className="size-4" aria-hidden />
            <AlertTitle>Pomyślnie zapisano</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SaveButton onRequestSubmit={handleSubmitRequest} disabled={!isDirty} />
          <p className="text-xs text-slate-300/80">
            Zmiany obowiązują od razu po zapisaniu. Możesz wrócić do poprzedniej nazwy lub strefy w dowolnym momencie.
          </p>
        </div>
      </form>

      <Dialog open={timezoneDialogOpen} onOpenChange={setTimezoneDialogOpen}>
        <DialogContent className="border border-amber-500/40 bg-amber-950/60 text-amber-50">
          <DialogHeader>
            <DialogTitle>Potwierdź zmianę strefy czasowej</DialogTitle>
            <DialogDescription className="text-amber-100/80">
              Wszystkie przyszłe rutyny zostaną przeplanowane do nowej strefy. Upewnij się, że dzieci rozpoczną dzień o
              właściwej godzinie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <p className="font-medium text-amber-50">Poprzednia strefa: {baseline.timezone}</p>
            <p className="font-medium text-amber-50">Nowa strefa: {timezone}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" className="border border-amber-500/40 bg-transparent text-amber-100" onClick={() => setTimezoneDialogOpen(false)}>
              Anuluj
            </Button>
            <Button type="button" className="bg-amber-400 text-amber-950 hover:bg-amber-300" onClick={handleConfirmTimezone}>
              Potwierdź zmianę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isDirty ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-xl items-center gap-3 rounded-full border border-teal-500/40 bg-slate-950/80 px-5 py-3 text-sm text-teal-100 shadow-lg shadow-teal-900/30 backdrop-blur">
            <Loader2 className="size-4 animate-spin text-teal-200" aria-hidden />
            <div className="flex flex-col">
              <span className="font-semibold">Masz niezapisane zmiany</span>
              <span className="text-xs text-teal-100/80">Kliknij „Zapisz zmiany”, aby zsynchronizować ustawienia.</span>
            </div>
            <Button size="sm" className="ml-auto" onClick={handleSubmitRequest}>
              Zapisz teraz
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
