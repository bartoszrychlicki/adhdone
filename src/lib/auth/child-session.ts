import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const CHILD_SESSION_COOKIE = "child_session"
const CHILD_SESSION_TTL_MINUTES = 120

type ChildSessionPayload = {
  childId: string
  familyId: string
  displayName: string
  expiresAt: string
}

function serializeSession(payload: ChildSessionPayload): string {
  return JSON.stringify(payload)
}

function deserializeSession(raw: string | undefined): ChildSessionPayload | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ChildSessionPayload>
    if (!parsed.childId || !parsed.familyId || !parsed.displayName || !parsed.expiresAt) {
      return null
    }
    return parsed as ChildSessionPayload
  } catch {
    return null
  }
}

export async function setChildSession(params: {
  childId: string
  familyId: string
  displayName: string
  durationMinutes?: number
}): Promise<void> {
  const store = await cookies()
  const durationMinutes = params.durationMinutes ?? CHILD_SESSION_TTL_MINUTES
  const expiresAt = new Date(Date.now() + durationMinutes * 60_000)

  const payload: ChildSessionPayload = {
    childId: params.childId,
    familyId: params.familyId,
    displayName: params.displayName,
    expiresAt: expiresAt.toISOString(),
  }

  store.set(CHILD_SESSION_COOKIE, serializeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })
}

export async function clearChildSession(): Promise<void> {
  const store = await cookies()
  store.delete(CHILD_SESSION_COOKIE)
}

export async function getActiveChildSession(): Promise<ChildSessionPayload | null> {
  const store = await cookies()
  const raw = store.get(CHILD_SESSION_COOKIE)?.value
  const session = deserializeSession(raw)

  if (!session) {
    return null
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    store.delete(CHILD_SESSION_COOKIE)
    return null
  }

  return session
}

export async function requireChildSession(): Promise<ChildSessionPayload> {
  const session = await getActiveChildSession()
  if (!session) {
    redirect("/auth/child")
  }
  return session
}

export type ChildSession = ChildSessionPayload
