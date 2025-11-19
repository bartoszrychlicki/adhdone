"use server"

import { AuthApiError } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase"
import { getAppBaseUrl } from "@/lib/env"
import { ensureParentProfile } from "@/lib/auth/ensure-parent-profile"
import { loginSchema, registerSchema } from "@/lib/auth/schemas"

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: Record<string, string[]> }

export type SignupState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: Record<string, string[]> }

function resolveEmailRedirect(): string | undefined {
  try {
    const url = new URL(getAppBaseUrl())
    url.pathname = "/auth/parent/confirm"
    return url.toString()
  } catch {
    return undefined
  }
}

export async function signUpParent(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  console.log("[signUpParent] start")

  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms") === "true",
  }

  const validation = registerSchema.safeParse(rawData)

  if (!validation.success) {
    console.warn("[signUpParent] validation failed", validation.error.flatten())
    return {
      status: "error",
      message: "Formularz zawiera błędy. Popraw je i spróbuj ponownie.",
      errors: validation.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validation.data

  const supabase = await createSupabaseServerClient({ allowCookiePersistence: true })
  console.log("[signUpParent] calling supabase.auth.signUp", {
    redirectTo: resolveEmailRedirect(),
  })

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "parent",
      },
      emailRedirectTo: resolveEmailRedirect(),
    },
  })

  if (error) {
    console.error("[signUpParent] supabase error", error)
    if (error instanceof AuthApiError && error.status === 400) {
      return {
        status: "error",
        message:
          "Nie mogliśmy utworzyć konta. Upewnij się, że email nie jest już zarejestrowany lub spróbuj odzyskać hasło.",
      }
    }

    return {
      status: "error",
      message: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.",
    }
  }

  if (data.session) {
    await ensureParentProfile(data.user)
    console.log("[signUpParent] session created, redirecting")
    redirect("/parent/dashboard")
  }

  console.log("[signUpParent] success without session (awaiting email confirmation)")
  redirect("/auth/parent?status=confirm_email")
}

export async function loginParent(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  console.log("[loginParent] start")

  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const validation = loginSchema.safeParse(rawData)

  if (!validation.success) {
    console.warn("[loginParent] validation failed", validation.error.flatten())
    return {
      status: "error",
      message: "Sprawdź poprawność wprowadzonych danych.",
      errors: validation.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validation.data

  const supabase = await createSupabaseServerClient({ allowCookiePersistence: true })
  console.log("[loginParent] calling supabase.auth.signInWithPassword")
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("[loginParent] supabase error", error)
    if (error instanceof AuthApiError && error.status === 400) {
      return {
        status: "error",
        message: "Nieprawidłowe dane logowania lub konto nie istnieje.",
      }
    }

    return {
      status: "error",
      message: "Nie udało się zalogować. Spróbuj ponownie później.",
    }
  }

  if (!data.session) {
    console.warn("[loginParent] sign-in returned no session", {
      user: data.user?.id,
      emailConfirmedAt: data.user?.email_confirmed_at,
    })
    return {
      status: "error",
      message:
        "Logowanie nie powiodło się. Upewnij się, że potwierdziłeś adres email i spróbuj ponownie.",
    }
  }

  await ensureParentProfile(data.user)
  console.log("[loginParent] login success, redirecting")
  redirect("/parent/dashboard")
}

export async function logoutParent(): Promise<void> {
  const supabase = await createSupabaseServerClient({ allowCookiePersistence: true })

  try {
    await supabase.auth.signOut({ scope: "global" })
  } catch (error) {
    console.error("[logoutParent] Failed to sign out", error)
  }

  redirect("/auth/parent?status=logged_out")
}
