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

    await page.goto("/parent/children")
    await page.getByRole("button", { name: /Wejdź jako dziecko/i }).first().click()

    await expect(page).toHaveURL(`/parent/children/${childProfile.id}/preview`)
    await expect(page.getByText("Podgląd interfejsu dziecka")).toBeVisible()
    await expect(page.getByRole("heading", { name: new RegExp(childProfile.displayName, "i") })).toBeVisible()
    await expect(page.getByRole("link", { name: "Powrót do panelu rodzica" })).toBeVisible()
  })
})
