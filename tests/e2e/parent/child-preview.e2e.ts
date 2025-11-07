import { expect, test } from "../fixtures/parent"

test.describe("Parent child preview", () => {
  test("parent can open child preview from list", async ({
    page,
    parentAccount,
    childProfile,
  }) => {
    await page.goto("/auth/parent")
    await page.getByLabel("Adres email").fill(parentAccount.email)
    await page.getByLabel("Hasło").fill(parentAccount.password)
    await page.getByRole("button", { name: "Zaloguj się" }).click()
    await expect(page).toHaveURL(/\/parent\/dashboard/)

    await page.goto("/parent/children")
    await page.getByRole("link", { name: /Wejdź jako dziecko/i }).first().click()

    await expect(page).toHaveURL(`/parent/children/${childProfile.id}/preview`)
    const previewAlert = page.getByRole("alert").filter({ hasText: "Podgląd interfejsu dziecka" }).first()
    await expect(previewAlert).toBeVisible()
    await expect(page.getByText(new RegExp(childProfile.displayName, "i")).first()).toBeVisible()
    await expect(page.getByRole("link", { name: "Powrót do panelu rodzica" })).toBeVisible()
  })
})
