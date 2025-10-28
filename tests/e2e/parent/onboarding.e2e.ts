import { expect, test } from "../fixtures/parent"

test.describe("Parent onboarding", () => {
  test("parent can log in and view onboarding dashboard", async ({ page, parentAccount }) => {
    await page.goto("/auth/parent")

    await page.getByLabel("Adres email").fill(parentAccount.email)
    await page.getByLabel("Hasło").fill(parentAccount.password)
    await page.getByRole("button", { name: "Zaloguj się" }).click()

    await expect(page).toHaveURL(/\/parent\/dashboard/)
    await expect(page.getByText("Dokończ onboarding")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Panel rodzica" })).toBeVisible()
  })

  test("family onboarding step is accessible after login", async ({ page, parentAccount }) => {
    await page.goto("/auth/parent")
    await page.getByLabel("Adres email").fill(parentAccount.email)
    await page.getByLabel("Hasło").fill(parentAccount.password)
    await page.getByRole("button", { name: "Zaloguj się" }).click()

    await expect(page).toHaveURL(/\/parent\/dashboard/)
    await page.goto("/onboarding/family")

    await expect(page.getByText("Przygotuj się na krok 2", { exact: false })).toBeVisible()
  })
})
