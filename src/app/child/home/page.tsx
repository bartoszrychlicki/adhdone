import { redirect } from "next/navigation"

import { RoutineBoard } from "@/components/child/routine-board"
import { fetchChildRoutineBoard } from "@/lib/child/queries"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { createSupabaseServerClient } from "@/lib/supabase"

export default async function ChildHomePage() {
  const activeProfile = await getActiveProfile()

  if (!activeProfile) {
    redirect("/auth/child")
  }

  if (activeProfile.role !== "child") {
    redirect("/parent/dashboard")
  }

  const supabase = await createSupabaseServerClient()
  const routines = await fetchChildRoutineBoard(supabase, activeProfile.id)

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
