import { headers } from "next/headers"
import { ForbiddenError, UnauthorizedError, ValidationError } from "./errors"
import type { Enums } from "@/db/database.types"
import type { Uuid } from "@/types"
import type { AppSupabaseClient } from "./types"

type ProfileRole = Enums<"profile_role">

export type AuthContext = {
  profileId: Uuid
  familyId?: Uuid
  role: ProfileRole
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseUuid(value: string | null, field: string): Uuid | undefined {
  if (!value) {
    return undefined
  }

  if (!uuidRegex.test(value)) {
    throw new ValidationError(`Invalid UUID format for ${field}`, { value })
  }

  return value
}

function parseRole(value: string | null): ProfileRole {
  const fallbackRole: ProfileRole = "parent"
  if (!value) {
    return fallbackRole
  }

  if (value === "parent" || value === "child" || value === "admin") {
    return value
  }

  throw new ValidationError("Invalid role in auth context", { role: value })
}

export async function requireAuthContext(
  supabase: AppSupabaseClient
): Promise<AuthContext> {
  const hdrs = await headers()

  // Try debug headers first (for testing)
  const debugProfileId = parseUuid(hdrs.get("x-debug-profile-id"), "profileId")
  if (debugProfileId) {
    const debugFamilyId = parseUuid(hdrs.get("x-debug-family-id"), "familyId")
    const debugRole = parseRole(hdrs.get("x-debug-role"))

    return {
      profileId: debugProfileId,
      familyId: debugFamilyId,
      role: debugRole
    }
  }

  // Otherwise, read from Supabase Auth session
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new UnauthorizedError("Missing authentication context")
  }

  // Fetch profile from database
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, family_id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (profileError) {
    throw new UnauthorizedError("Failed to load user profile")
  }

  if (!profile) {
    throw new UnauthorizedError("User profile not found")
  }

  return {
    profileId: profile.id,
    familyId: profile.family_id,
    role: profile.role
  }
}

export function assertFamilyAccess(
  context: AuthContext,
  familyId: Uuid
): void {
  if (context.familyId !== familyId) {
    throw new ForbiddenError("Cannot access another family")
  }
}

export function assertParentOrAdmin(context: AuthContext): void {
  if (context.role === "parent" || context.role === "admin") {
    return
  }

  throw new ForbiddenError("Insufficient role")
}
