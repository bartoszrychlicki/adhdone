import { expect, test } from "../fixtures/parent"

test.describe("Parent rewards catalog", () => {
  test("displays empty state after fresh provisioning", async ({ page, parentAccount }) => {
    await page.goto("/auth/parent")
    await page.getByLabel("Adres email").fill(parentAccount.email)
    await page.getByLabel("Hasło").fill(parentAccount.password)
    await page.getByRole("button", { name: "Zaloguj się" }).click()

    await page.goto("/parent/rewards")

    await expect(
      page.getByRole("heading", { name: "Nagrody w katalogu" })
    ).toBeVisible()
    await expect(page.getByText("Brak nagród")).toBeVisible()
  })
})
