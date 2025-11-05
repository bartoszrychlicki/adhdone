import type { Metadata } from "next"

import { RoutineBoard } from "@/components/child/routine-board"
import { fetchChildRoutineBoard } from "@/lib/child/queries"
import { createSupabaseServiceRoleClient } from "@/lib/supabase"
import { requireChildSession } from "@/lib/auth/child-session"

export const metadata: Metadata = {
  title: "Start dziecka",
  description: "Zobacz rutyny dostępne dzisiaj i przygotuj się na kolejne zadania.",
}

export default async function ChildHomePage() {
  const session = await requireChildSession()
  const supabase = createSupabaseServiceRoleClient()
  const routines = await fetchChildRoutineBoard(supabase, session.childId)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-violet-200/70">Dzień pełen misji</p>
        <h2 className="text-2xl font-semibold text-white">Wybierz, co robimy teraz</h2>
        <p className="text-sm text-violet-100/80">
          Rutyny z zielonym obramowaniem są dostępne od razu. Kolejne pokażemy z wyprzedzeniem i przypomnimy o starcie.
        </p>
      </header>

      <RoutineBoard routines={routines} />
    </div>
  )
}
