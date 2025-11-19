"use client"

import { useActionState, useMemo } from "react"
import Image from "next/image"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { saveRewardsSetupAction, type RewardsSetupState } from "./actions"
import type { RewardTemplate } from "@/data/reward-templates"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const initialState: RewardsSetupState = { status: "idle" }

type CustomReward = {
  id: string
  name: string
  cost_points: number
  description?: string | null // Changed to allow null which comes from DB
}

type RewardsSetupFormProps = {
  familyId: string
  templates: RewardTemplate[]
  existingTemplateIds: Set<string>
  customRewards: CustomReward[]
}

export function RewardsSetupForm({
  familyId,
  templates,
  existingTemplateIds,
  customRewards,
}: RewardsSetupFormProps) {
  const [state, formAction] = useActionState(saveRewardsSetupAction, initialState)

  const groupedTemplates = useMemo(() => {
    return templates.reduce<Record<string, RewardTemplate[]>>((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = []
      }
      acc[template.category].push(template)
      return acc
    }, {})
  }, [templates])

  return (
    <div className="space-y-6">
      {state.status === "error" ? (
        <Alert variant="destructive" className="border-red-500/40 bg-red-500/10 text-red-100">
          <AlertCircle className="size-4" aria-hidden />
          <AlertTitle>Nie udało się zapisać nagród</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {state.status === "success" ? (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100">
          <CheckCircle2 className="size-4" aria-hidden />
          <AlertTitle>Nagrody zaktualizowane</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="familyId" value={familyId} />

        <div className="space-y-4">
          <Card className="border-slate-800/60 bg-slate-950/40 text-slate-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Nagrody szablonowe</CardTitle>
              <CardDescription className="text-sm text-slate-200/80">
                Zaznacz nagrody, które chcesz dodać do katalogu. Już dodane nagrody są wyszarzone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {Object.entries(groupedTemplates).map(([category, items]) => (
                <section key={category} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-slate-300">
                    <Badge variant="outline" className="border-slate-700/60 bg-slate-900/60 text-xs text-slate-200">
                      {CATEGORY_LABELS[category] ?? category}
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((template) => {
                      const alreadyAdded = existingTemplateIds.has(template.id)
                      return (
                        <label
                          key={template.id}
                          className={cn(
                            "flex gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 text-sm text-slate-200/90",
                            alreadyAdded ? "opacity-60" : "hover:border-slate-200/50"
                          )}
                        >
                          <Checkbox
                            name="selectedTemplates"
                            value={template.id}
                            defaultChecked={!alreadyAdded}
                            disabled={alreadyAdded}
                            className="mt-1"
                          />
                          <div className="flex flex-1 flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-white">{template.name}</span>
                              <span className="text-xs text-teal-200/90">{template.costPoints} pkt</span>
                            </div>
                            <p className="text-xs text-slate-300/80">{template.description}</p>
                            <div className="relative h-24 w-full overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/70">
                              <Image
                                src={template.imageUrl}
                                alt={template.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover"
                                onError={(event) => {
                                  const target = event.currentTarget as HTMLImageElement | undefined
                                  if (target) {
                                    target.src = "/images/rewards/placeholder.svg"
                                  }
                                }}
                              />
                            </div>
                            {alreadyAdded ? (
                              <span className="text-xs font-medium text-yellow-200/90">Nagroda już dodana</span>
                            ) : null}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </section>
              ))}
            </CardContent>
          </Card>
        </div>

        {customRewards.length > 0 && (
          <Card className="border-slate-800/60 bg-slate-950/40 text-slate-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Twoje własne nagrody</CardTitle>
              <CardDescription className="text-sm text-slate-200/80">
                Nagrody, które dodałeś ręcznie do katalogu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {customRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 text-sm text-slate-200/90"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white">{reward.name}</span>
                      <span className="text-xs text-teal-200/90">{reward.cost_points} pkt</span>
                    </div>
                    {reward.description && (
                      <p className="text-xs text-slate-300/80">{reward.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <Badge variant="outline" className="border-slate-700/60 bg-slate-900/60 text-[10px] text-slate-300">
                        Własna
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-800/60 bg-slate-950/40 text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dodaj własną nagrodę</CardTitle>
            <CardDescription className="text-sm text-slate-200/80">
              Wypełnij poniższy formularz, aby zapisać niestandardową nagrodę. Możesz ją modyfikować po zapisie.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-white">Nazwa nagrody</span>
                <Input name="customName" placeholder="np. Wspólne pieczenie ciasteczek" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-white">Koszt punktowy</span>
                <Input name="customPoints" type="number" min={5} step={5} placeholder="50" />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-white">Opis (opcjonalnie)</span>
              <Textarea
                name="customDescription"
                placeholder="Napisz, co dokładnie obejmuje nagroda, aby dziecko wiedziało czego się spodziewać."
                rows={3}
              />
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-200/80">
              <Checkbox name="customRepeatable" value="true" defaultChecked className="mt-1" />
              Nagroda może być wykupiona wielokrotnie.
            </label>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" size="lg">
            Zapisz nagrody
          </Button>
          <p className="text-xs text-slate-300/80">
            Możesz dodawać kolejne nagrody w panelu rodzica. Zaznaczone szablony zostaną zapisane od razu.
          </p>
        </div>
      </form>
    </div>
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  aktywnosc: "Aktywności",
  media: "Media i technologia",
  rodzina: "Czas z rodziną",
}
