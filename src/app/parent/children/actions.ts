"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

function resolveOrigin() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SITE_URL ?? "http://localhost:3000"
  return base.replace(/\/$/, "")
}

async function performAuthedRequest(path: string, init: RequestInit) {
  const cookieHeader = (await cookies()).toString()
  const response = await fetch(`${resolveOrigin()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.error?.message ?? "Operacja nie powiodła się."
    throw new Error(message)
  }

  return response
}

export async function generateTokenAction(
  _prevState: { status: "idle" | "success" | "error"; message?: string },
  formData: FormData
) {
  try {
    const childId = formData.get("childId")
    if (typeof childId !== "string" || childId.length === 0) {
      return { status: "error", message: "Brak identyfikatora dziecka." }
    }

    await performAuthedRequest(`/api/v1/profiles/${childId}/access-tokens`, {
      method: "POST",
      body: JSON.stringify({}),
    })

    revalidatePath("/parent/children")
    return { status: "success", message: "Wygenerowano nowy token." }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Nie udało się wygenerować tokenu.",
    }
  }
}

export async function deactivateTokenAction(
  _prevState: { status: "idle" | "success" | "error"; message?: string },
  formData: FormData
) {
  try {
    const childId = formData.get("childId")
    const tokenId = formData.get("tokenId")

    if (typeof childId !== "string" || typeof tokenId !== "string" || childId.length === 0 || tokenId.length === 0) {
      return { status: "error", message: "Brak identyfikatora tokenu." }
    }

    await performAuthedRequest(`/api/v1/child-access-tokens/${tokenId}/deactivate`, {
      method: "POST",
      body: JSON.stringify({}),
    })

    revalidatePath("/parent/children")
    return { status: "success", message: "Token został dezaktywowany." }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Nie udało się dezaktywować tokenu.",
    }
  }
}
