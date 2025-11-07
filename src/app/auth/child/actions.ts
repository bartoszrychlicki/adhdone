"use server"

import { redirect } from "next/navigation"

import { createSupabaseServiceRoleClient } from "@/lib/supabase"
import { setChildSession } from "@/lib/auth/child-session"
import { fetchChildRoutineBoard } from "@/lib/child/queries"

type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string }

function sanitizePin(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null
  }

  const pin = value.trim()
  if (pin.length === 0) {
    return ""
  }

  return /^[0-9]{4,6}$/.test(pin) ? pin : null
}

export async function loginChild(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const pin = sanitizePin(formData.get("pin"))
  const childIdRaw = formData.get("childId")

  if (pin === null) {
    return {
      status: "error",
      message: "PIN powinien składać się z 4–6 cyfr.",
    }
  }

  if (pin.length === 0) {
    return {
      status: "error",
      message: "PIN jest wymagany.",
    }
  }

  if (typeof childIdRaw !== "string" || childIdRaw.trim().length === 0) {
    return {
      status: "error",
      message: "Link logowania nie zawiera identyfikatora dziecka.",
    }
  }

  const childId = childIdRaw.trim()

  const supabase = createSupabaseServiceRoleClient()

  const { data: childProfile, error } = await supabase
    .from("profiles")
    .select("id, family_id, display_name, role, deleted_at, settings")
    .eq("id", childId)
    .maybeSingle()

  if (error) {
    console.error("[loginChild] Failed to fetch child profile", error)
    return {
      status: "error",
      message: "Nie udało się zweryfikować profilu dziecka.",
    }
  }

  if (!childProfile || childProfile.deleted_at || childProfile.role !== "child") {
    return {
      status: "error",
      message: "Link logowania jest nieprawidłowy lub profil został dezaktywowany.",
    }
  }

  const settings = (childProfile.settings as Record<string, unknown> | null) ?? null
  const storedPin = typeof settings?.pin_plain === "string" ? settings.pin_plain : null

  if (!storedPin || storedPin !== pin) {
    return {
      status: "error",
      message: "PIN jest nieprawidłowy. Spróbuj ponownie lub poproś rodzica o aktualizację.",
    }
  }

  await fetchChildRoutineBoard(supabase, childProfile.id)

  await setChildSession({
    childId: childProfile.id,
    familyId: childProfile.family_id,
    displayName: childProfile.display_name,
  })

  redirect("/child/routines")
}
