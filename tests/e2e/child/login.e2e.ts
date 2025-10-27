import { expect, test } from "@playwright/test"

test.describe("Child login UX", () => {
  test("shows guidance when token is missing", async ({ page }) => {
    await page.goto("/auth/child")

    await page.getByRole("button", { name: "Wejdź do rutyn" }).click()

    await expect(
      page.getByText("Logowanie dziecka zostanie aktywowane", { exact: false })
    ).toBeVisible()
  })
})
