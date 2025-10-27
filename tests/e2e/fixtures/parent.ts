import { test as base } from "@playwright/test"

import {
  createParentAccount,
  deleteParentAccount,
  getMissingSupabaseAdminEnv,
} from "../utils/supabase-admin"

export type ParentAccountFixture = Awaited<ReturnType<typeof createParentAccount>>

export const test = base.extend<{ parentAccount: ParentAccountFixture }>({
  parentAccount: [
    async ({}, use, testInfo) => {
      const missing = getMissingSupabaseAdminEnv()
      if (missing.length > 0) {
        testInfo.skip(
          `Pominięto scenariusz wymagający Supabase. Ustaw zmienne środowiskowe: ${missing.join(", ")}`
        )
      }

      const account = await createParentAccount()

      try {
        await use(account)
      } finally {
        await deleteParentAccount(account)
      }
    },
    { scope: "test" },
  ],
})

export const expect = test.expect
