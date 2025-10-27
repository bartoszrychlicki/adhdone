"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase"

export type ToggleRoutineState = {
  status: "idle" | "success" | "error"
  message?: string
}

export async function toggleRoutineActiveAction(
  _prev: ToggleRoutineState,
  formData: FormData
): Promise<ToggleRoutineState> {
  try {
    const routineId = formData.get("routineId")
    const desiredState = formData.get("isActive")

    if (typeof routineId !== "string" || routineId.length === 0) {
      return { status: "error", message: "Brak identyfikatora rutyny." }
    }

    const isActive = desiredState === "true"

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { status: "error", message: "Twoja sesja wygasła. Zaloguj się ponownie." }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, family_id")
      .eq("auth_user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle()

    if (profileError || !profile?.family_id) {
      return { status: "error", message: "Nie znaleziono profilu rodzica." }
    }

    if (profile.role !== "parent" && profile.role !== "admin") {
      return { status: "error", message: "Brak uprawnień do zmiany statusu rutyny." }
    }

    const serviceClient = createSupabaseServiceRoleClient()
    const { error: updateError } = await serviceClient
      .from("routines")
      .update({ is_active: isActive })
      .eq("id", routineId)
      .eq("family_id", profile.family_id)

    if (updateError) {
      console.error("[toggleRoutineActiveAction] update failed", updateError)
      return { status: "error", message: "Nie udało się zaktualizować rutyny." }
    }

    revalidatePath("/parent/routines")
    return { status: "success", message: "Status rutyny został zaktualizowany." }
  } catch (error) {
    console.error("[toggleRoutineActiveAction] unexpected", error)
    return { status: "error", message: "Wystąpił nieoczekiwany błąd." }
  }
}
