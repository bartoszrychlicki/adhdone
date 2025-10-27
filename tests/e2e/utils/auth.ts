import type { Page } from "@playwright/test"

import type { SupabaseSessionCookie } from "./supabase-admin"

type SameSiteAttribute = "Lax" | "Strict" | "None"
type RawSameSite =
  SupabaseSessionCookie["options"] extends { sameSite?: infer T }
    ? T
    : never

function normalizeSameSite(value: RawSameSite | undefined): SameSiteAttribute | undefined {
  if (typeof value === "string") {
    const normalized = value.toLowerCase()
    if (normalized === "lax") return "Lax"
    if (normalized === "strict") return "Strict"
    if (normalized === "none") return "None"
  }
  if (value === true) {
    return "Strict"
  }
  if (value === false) {
    return "Lax"
  }
  return undefined
}

export async function applySupabaseSessionCookies(
  page: Page,
  cookies: SupabaseSessionCookie[],
  baseUrl: string
): Promise<void> {
  const url = new URL(baseUrl)
  const domain = url.hostname
  const secureDefault = url.protocol === "https:"
  const now = Math.floor(Date.now() / 1000)

  await page.context().clearCookies()

  const playwrightCookies = cookies.map((cookie) => {
    const sameSite = normalizeSameSite(cookie.options?.sameSite)
    const maxAge = cookie.options?.maxAge
    return {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.options?.domain ?? domain,
      path: cookie.options?.path ?? "/",
      httpOnly: cookie.options?.httpOnly ?? false,
      secure: cookie.options?.secure ?? secureDefault,
      sameSite,
      expires: typeof maxAge === "number" ? now + maxAge : undefined,
    }
  })

  await page.context().addCookies(playwrightCookies)
}
