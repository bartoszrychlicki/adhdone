"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase"

export type ChildTaskUpdateState = {
  status: "idle" | "success" | "error"
  message?: string
}

async function getParentContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Twoja sesja wygasła. Zaloguj się ponownie." } as const
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, family_id, role")
    .eq("auth_user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (profileError || !profile?.family_id) {
    return { error: "Nie znaleziono profilu rodzica." } as const
  }

  if (profile.role !== "parent" && profile.role !== "admin") {
    return { error: "Brak uprawnień do edycji tej rutyny." } as const
  }

  return {
    familyId: profile.family_id,
    profileId: profile.id,
  } as const
}

export async function updateChildTaskAction(
  _prev: ChildTaskUpdateState,
  formData: FormData
): Promise<ChildTaskUpdateState> {
  try {
    const context = await getParentContext()
    if ("error" in context) {
      return { status: "error", message: context.error }
    }

    const routineId = formData.get("routineId")
    const childId = formData.get("childId")
    const taskId = formData.get("taskId")
    const pointsRaw = formData.get("points")
    const enabledFlag = formData.get("isEnabled")

    if (typeof routineId !== "string" || routineId.length === 0) {
      return { status: "error", message: "Brak identyfikatora rutyny." }
    }

    if (typeof childId !== "string" || childId.length === 0) {
      return { status: "error", message: "Brak identyfikatora dziecka." }
    }

    if (typeof taskId !== "string" || taskId.length === 0) {
      return { status: "error", message: "Brak identyfikatora zadania." }
    }

    const points = Number.parseInt(typeof pointsRaw === "string" ? pointsRaw : "0", 10)
    if (!Number.isFinite(points) || points < 0) {
      return { status: "error", message: "Punkty muszą być liczbą nieujemną." }
    }

    const isEnabled = enabledFlag !== "false"

    const serviceClient = createSupabaseServiceRoleClient()

    const { error: updateError } = await serviceClient
      .from("routine_tasks")
      .update({
        points,
        is_active: isEnabled,
      })
      .eq("id", taskId)
      .eq("routine_id", routineId)
      .eq("child_profile_id", childId)

    if (updateError) {
      console.error("[updateChildTaskAction] failed", updateError)
      return { status: "error", message: "Nie udało się zaktualizować zadania." }
    }

    revalidatePath(`/parent/routines/${routineId}/children/${childId}`)
    return { status: "success", message: "Zadanie zostało zaktualizowane." }
  } catch (error) {
    console.error("[updateChildTaskAction] unexpected", error)
    return { status: "error", message: "Wystąpił nieoczekiwany błąd." }
  }
}

export async function toggleChildTaskAction(
  _prev: ChildTaskUpdateState,
  formData: FormData
): Promise<ChildTaskUpdateState> {
  try {
    const context = await getParentContext()
    if ("error" in context) {
      return { status: "error", message: context.error }
    }

    const routineId = formData.get("routineId")
    const childId = formData.get("childId")
    const taskId = formData.get("taskId")
    const enabledFlag = formData.get("isEnabled")

    if (typeof routineId !== "string" || routineId.length === 0) {
      return { status: "error", message: "Brak identyfikatora rutyny." }
    }

    if (typeof childId !== "string" || childId.length === 0) {
      return { status: "error", message: "Brak identyfikatora dziecka." }
    }

    if (typeof taskId !== "string" || taskId.length === 0) {
      return { status: "error", message: "Brak identyfikatora zadania." }
    }

    const isEnabled = enabledFlag === "true"

    const serviceClient = createSupabaseServiceRoleClient()
    const { error: updateError } = await serviceClient
      .from("routine_tasks")
      .update({ is_active: isEnabled })
      .eq("id", taskId)
      .eq("routine_id", routineId)
      .eq("child_profile_id", childId)

    if (updateError) {
      console.error("[toggleChildTaskAction] failed", updateError)
      return { status: "error", message: "Nie udało się zmienić statusu zadania." }
    }

    revalidatePath(`/parent/routines/${routineId}/children/${childId}`)
    return { status: "success", message: "Status zadania został zaktualizowany." }
  } catch (error) {
    console.error("[toggleChildTaskAction] unexpected", error)
    return { status: "error", message: "Wystąpił nieoczekiwany błąd." }
  }
}
