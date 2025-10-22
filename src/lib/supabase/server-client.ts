import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import type { Database } from "../../../supabase/types/database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.")
}

type ServerClientOptions = {
  allowCookiePersistence?: boolean
}

export async function createSupabaseServerClient(options: ServerClientOptions = {}) {
  async function getCookieStore() {
    return cookies()
  }

  const allowWrites = options.allowCookiePersistence === true

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name) {
        return (await getCookieStore()).get(name)?.value
      },
      async set(name, value, cookieOptions) {
        if (!allowWrites) {
          return
        }

        const store = await getCookieStore()
        store.set({ name, value, ...cookieOptions })
      },
      async remove(name, cookieOptions) {
        if (!allowWrites) {
          return
        }

        const store = await getCookieStore()
        store.delete({ name, ...cookieOptions })
      },
    },
  })
}
