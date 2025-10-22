import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/db/database.types"

/**
 * Type for Supabase client that works with both server and service clients.
 * Uses 'any' for schema parameters to avoid type incompatibility between
 * createServerClient and createClient implementations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppSupabaseClient = SupabaseClient<Database, "public", any>
