import {
  createChildAccountForProfile,
  createSupabaseSessionCookies,
  deleteChildAccount,
  seedChildViewData,
  type ChildAccountFixture,
  type ChildViewSeedResult,
  type SupabaseSessionCookie,
} from "../utils/supabase-admin"
import { test as parentTest } from "./parent"

export const test = parentTest.extend<{
  childAccountAuth: ChildAccountFixture
  childSessionCookies: SupabaseSessionCookie[]
  childSeedData: ChildViewSeedResult
}>({
  childAccountAuth: [
    async ({ parentAccount, childProfile }, use) => {
      const account = await createChildAccountForProfile(parentAccount.familyId, childProfile)

      try {
        await use(account)
      } finally {
        await deleteChildAccount(account)
      }
    },
    { scope: "test" },
  ],
  childSessionCookies: [
    async ({ childAccountAuth }, use) => {
      const cookies = await createSupabaseSessionCookies(childAccountAuth.email, childAccountAuth.password)
      await use(cookies)
    },
    { scope: "test" },
  ],
  childSeedData: [
    async ({ parentAccount, childAccountAuth }, use) => {
      const seed = await seedChildViewData(parentAccount.familyId, childAccountAuth.profileId)
      await use(seed)
    },
    { scope: "test" },
  ],
})

export const expect = test.expect
