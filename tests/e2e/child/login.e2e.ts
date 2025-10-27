import { expect, test } from "@playwright/test"

test.describe("Child login UX", () => {
  test("shows validation message for invalid PIN", async ({ page }) => {
    await page.goto("/auth/child")

    await page.getByLabel("Token dostępu (polecane)").fill("short")
    await page.getByRole("button", { name: "Wejdź do rutyn" }).click()

    await expect(
      page.getByText("Logowanie dziecka zostanie aktywowane", { exact: false })
    ).toBeVisible()
  })
})
