import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Clock, Medal, Trophy } from "lucide-react"

import type { Metadata } from "next"

import { CelebrationBanner } from "@/components/child/celebration-banner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchChildRoutineSessionViewModelForChild, fetchChildRoutineSuccessSummary } from "@/lib/child/queries"
import { createSupabaseServiceRoleClient } from "@/lib/supabase"
import { requireChildSession } from "@/lib/auth/child-session"

export const metadata: Metadata = {
  title: "Rutyna ukończona",
}

type RoutineSuccessPageProps = {
  params: Promise<{
    sessionId: string
  }>
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "niebawem"
  }

  try {
    return new Date(value).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return value
  }
}

export default async function RoutineSuccessPage({ params }: RoutineSuccessPageProps) {
  const { sessionId } = await params
  const sessionContext = await requireChildSession()
  const supabase = createSupabaseServiceRoleClient()
  const session = await fetchChildRoutineSessionViewModelForChild(supabase, sessionId, sessionContext.childId)

  if (!session) {
    notFound()
  }

  const data = await fetchChildRoutineSuccessSummary(supabase, sessionId, session)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <CelebrationBanner />

      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="border-teal-400/40 bg-teal-500/10 text-teal-50">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
              <Trophy className="size-5" aria-hidden />
              Zdobyte punkty
            </CardTitle>
            <CardDescription className="text-sm text-teal-100/90">Gratulacje! Utrzymujesz serię i bonus.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{data.pointsEarned} pkt</CardContent>
        </Card>

        <Card className="border-violet-400/40 bg-violet-500/10 text-violet-50">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
              <Clock className="size-5" aria-hidden />
              Czas rutyny
            </CardTitle>
            <CardDescription className="text-sm text-violet-100/90">
              {data.pointsRecord
                ? `Rekord rodziny: ${data.pointsRecord} pkt`
                : "Brak rekordu do pobicia. Możesz ustanowić swój pierwszy!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{data.totalTimeMinutes} min</CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Nowe odznaki</h2>
          <span className="text-xs text-violet-200/80">{data.badgesUnlocked.length} zdobyte</span>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.badgesUnlocked.map((badge) => (
            <Card key={badge.id} className="border-slate-800/60 bg-slate-900/40 text-slate-100">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                  <Medal className="size-4 text-amber-300" aria-hidden />
                  {badge.name}
                </CardTitle>
                <CardDescription className="text-sm text-slate-200/80">{badge.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {data.nextRoutine ? (
        <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Co dalej?</CardTitle>
            <CardDescription className="text-sm text-slate-200/80">
              Kolejna rutyna – {data.nextRoutine.name} – startuje o {formatDateTime(data.nextRoutine.startAt)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/child/rewards">
                Zobacz nagrody
                <ArrowRight className="ml-2 size-4" aria-hidden />
              </Link>
            </Button>
            <Button variant="ghost" asChild className="border border-slate-800/80">
              <Link href="/child/home">Wróć do tablicy rutyn</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
