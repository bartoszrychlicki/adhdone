import { createClient } from "@supabase/supabase-js"

import type { Database } from "../../../supabase/types/database.types"

export type SupabaseAdminClient = ReturnType<typeof createClient<Database>>

type CreateParentOptions = {
  email?: string
  password?: string
  displayName?: string
}

type ParentAccount = {
  userId: string
  email: string
  password: string
  familyId: string
  profileId: string
}

export type ParentAccountFixture = ParentAccount

export type ChildProfileFixture = {
  id: string
  displayName: string
}

function getEnv(name: string): string | undefined {
  const value = process.env[name]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export function getMissingSupabaseAdminEnv(): string[] {
  const required = [
    "PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY",
    "PLAYWRIGHT_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
  ]

  return required.filter((name) => {
    // Accept either PLAYWRIGHT_* overrides or default NEXT_PUBLIC_ / SUPABASE_ values.
    switch (name) {
      case "PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY":
        return !getEnv("PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY") && !getEnv("SUPABASE_SERVICE_ROLE_KEY")
      case "PLAYWRIGHT_SUPABASE_URL":
        return !getEnv("PLAYWRIGHT_SUPABASE_URL") && !getEnv("NEXT_PUBLIC_SUPABASE_URL")
      default:
        // we only report base envs if neither override nor default exists
        if (name === "SUPABASE_SERVICE_ROLE_KEY") {
          return !getEnv("PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY") && !getEnv("SUPABASE_SERVICE_ROLE_KEY")
        }
        if (name === "NEXT_PUBLIC_SUPABASE_URL") {
          return !getEnv("PLAYWRIGHT_SUPABASE_URL") && !getEnv("NEXT_PUBLIC_SUPABASE_URL")
        }
        return false
    }
  })
}

function createAdminClient(): SupabaseAdminClient {
  const url = getEnv("PLAYWRIGHT_SUPABASE_URL") ?? getEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey =
    getEnv("PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY") ?? getEnv("SUPABASE_SERVICE_ROLE_KEY")

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase service role environment variables are not set. Provide PLAYWRIGHT_SUPABASE_URL and PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY (or reuse NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function ensureParentResources(
  client: SupabaseAdminClient,
  userId: string,
  email: string,
  displayName: string
): Promise<{ familyId: string; profileId: string }> {
  const { data: existingProfile, error: profileError } = await client
    .from("profiles")
    .select("id, family_id")
    .eq("auth_user_id", userId)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (existingProfile?.family_id) {
    return {
      familyId: existingProfile.family_id,
      profileId: existingProfile.id,
    }
  }

  const { data: family, error: familyError } = await client
    .from("families")
    .insert({
      family_name: `Rodzina ${displayName}`,
      timezone: "Europe/Warsaw",
      settings: {
        onboarding: {
          completedSteps: [],
          isComplete: false,
        },
      },
    })
    .select("id")
    .maybeSingle()

  if (familyError || !family) {
    throw familyError ?? new Error("Failed to create family")
  }

  const { data: profile, error: insertProfileError } = await client
    .from("profiles")
    .insert({
      auth_user_id: userId,
      display_name: displayName,
      email,
      family_id: family.id,
      role: "parent",
      settings: {
        onboarding: {
          completedSteps: [],
          isComplete: false,
        },
      },
    })
    .select("id")
    .maybeSingle()

  if (insertProfileError || !profile) {
    throw insertProfileError ?? new Error("Failed to create parent profile")
  }

  return {
    familyId: family.id,
    profileId: profile.id,
  }
}

export async function createParentAccount(options: CreateParentOptions = {}): Promise<ParentAccount> {
  const client = createAdminClient()
  const email =
    options.email ??
    `parent+${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}@playwright.test`
  const password = options.password ?? `Pw!${crypto.randomUUID().slice(0, 8)}`
  const displayName = options.displayName ?? "Playwright Parent"

  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    email_confirmed_at: new Date().toISOString(),
    user_metadata: {
      full_name: displayName,
      role: "parent",
    },
  })

  if (error || !data.user) {
    throw error ?? new Error("Failed to create Supabase parent user")
  }

  const { familyId, profileId } = await ensureParentResources(client, data.user.id, email, displayName)

  return {
    userId: data.user.id,
    email,
    password,
    familyId,
    profileId,
  }
}

export async function deleteParentAccount(account: ParentAccount): Promise<void> {
  const client = createAdminClient()

  await client.from("profiles").delete().eq("family_id", account.familyId)
  await client.from("families").delete().eq("id", account.familyId)
  await client.auth.admin.deleteUser(account.userId)
}

type CreateChildOptions = {
  displayName?: string
}

export async function createChildProfileForFamily(
  familyId: string,
  options: CreateChildOptions = {}
): Promise<ChildProfileFixture> {
  const client = createAdminClient()
  const displayName = options.displayName ?? `Eryk ${crypto.randomUUID().slice(0, 4)}`

  const { data, error } = await client
    .from("profiles")
    .insert({
      family_id: familyId,
      role: "child",
      display_name: displayName,
      email: null,
      settings: {},
      pin_failed_attempts: 0,
      pin_lock_expires_at: null,
    })
    .select("id, display_name")
    .maybeSingle()

  if (error || !data) {
    throw error ?? new Error("Failed to create child profile")
  }

  return {
    id: data.id,
    displayName: data.display_name ?? displayName,
  }
}
