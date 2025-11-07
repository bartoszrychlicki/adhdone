import { expect, test } from "../fixtures/child"
import { applySupabaseSessionCookies } from "../utils/auth"

const BASE_URL_FALLBACK = "http://127.0.0.1:3000"

test.describe("Child reward redemption", () => {
  test("allows navigating via points badge and redeeming a reward", async ({
    page,
    childSessionCookies,
    childAccountAuth,
    childSeedData,
  }, testInfo) => {
    const baseURL = testInfo.project.use?.baseURL ?? BASE_URL_FALLBACK
    await applySupabaseSessionCookies(page, childSessionCookies, baseURL, {
      childId: childAccountAuth.profileId,
      familyId: childAccountAuth.familyId,
      displayName: childAccountAuth.displayName,
    })

    await page.goto("/child/routines")

    const pointsBadge = page.getByRole("link", { name: /saldo punktów/i })
    await expect(pointsBadge).toBeVisible()
    await pointsBadge.click()

    await expect(page).toHaveURL(/\/child\/rewards$/)
    const redeemButton = page.getByRole("button", { name: "Wymień punkty" })
    await redeemButton.click()

    await page.getByRole("button", { name: "Potwierdź" }).click()

    await expect(page.getByText(new RegExp(`Nagroda „${childSeedData.reward.name}” została zgłoszona`, "i"))).toBeVisible()
  })
})
