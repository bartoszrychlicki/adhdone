import { expect, test } from "../fixtures/child"
import { applySupabaseSessionCookies } from "../utils/auth"
import { ensureRoutineSessionWindow } from "../utils/supabase-admin"

const BASE_URL_FALLBACK = "http://127.0.0.1:3000"

test.describe("Child routine completion flow", () => {
  test("child can start a routine, finish tasks, and see completion summary", async ({
    page,
    childSessionCookies,
    childAccountAuth,
    childSeedData,
  }, testInfo) => {
    await ensureRoutineSessionWindow({
      familyId: childAccountAuth.familyId,
      childProfileId: childAccountAuth.profileId,
      routineType: "morning",
    })

    const baseURL = testInfo.project.use?.baseURL ?? BASE_URL_FALLBACK
    await applySupabaseSessionCookies(page, childSessionCookies, baseURL, {
      childId: childAccountAuth.profileId,
      familyId: childAccountAuth.familyId,
      displayName: childAccountAuth.displayName,
    })

    await page.goto("/child/routines")

    const startButton = page.getByRole("button", { name: "Start" })
    await expect(startButton).toBeVisible()
    await startButton.click()

    const taskButtons = page.getByRole("button", { name: "Zrobione" })
    while ((await taskButtons.count()) > 0) {
      await expect(taskButtons.first()).toBeEnabled()
      await taskButtons.first().click()
    }

    const finishButton = page.getByRole("button", { name: /Zakończ rutynę/i })
    await expect(finishButton).toBeEnabled()
    await finishButton.click()

    await expect(page).toHaveURL(/\/child\/routines\/.+\/success$/)
    const pointsCard = page.locator("section").filter({ hasText: "Zdobyte punkty" }).first()
    await expect(pointsCard).toContainText("35 pkt")
    const durationCard = page.locator("section").filter({ hasText: "Czas rutyny" }).first()
    await expect(durationCard).toContainText(":")
  })
})
