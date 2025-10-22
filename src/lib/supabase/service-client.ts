import { createClient } from "@supabase/supabase-js"

import type { Database } from "../../../supabase/types/database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.")
}

export function createSupabaseServiceRoleClient() {
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required to use the service client.")
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
