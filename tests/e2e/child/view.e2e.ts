import { applySupabaseSessionCookies } from "../utils/auth"
import { expect, test } from "../fixtures/child"

const BASE_URL_FALLBACK = "http://127.0.0.1:3000"

test.describe("Authenticated child experience", () => {
  test("displays the home routine board with current, upcoming, and completed missions", async ({
    page,
    childSessionCookies,
    childSeedData,
  }, testInfo) => {
    const baseURL = testInfo.project.use?.baseURL ?? BASE_URL_FALLBACK
    await applySupabaseSessionCookies(page, childSessionCookies, baseURL)

    await page.goto("/child/home")

    await expect(page.getByRole("heading", { name: "Wybierz, co robimy teraz" })).toBeVisible()
    await expect(page.getByRole("heading", { name: childSeedData.routines.today.name })).toBeVisible()
    await expect(page.getByRole("heading", { name: childSeedData.routines.upcoming.name })).toBeVisible()
    await expect(page.getByRole("heading", { name: childSeedData.routines.completed.name })).toBeVisible()
    await expect(page.getByText("Ukończone rutyny")).toBeVisible()
  })

  test("summarises routine stats and lists available missions", async ({
    page,
    childSessionCookies,
    childSeedData,
  }, testInfo) => {
    const baseURL = testInfo.project.use?.baseURL ?? BASE_URL_FALLBACK
    await applySupabaseSessionCookies(page, childSessionCookies, baseURL)

    await page.goto("/child/routines")

    await expect(page.getByRole("heading", { name: "Pełny harmonogram dnia" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Dostępne dziś" }).locator("..").getByText(
      String(childSeedData.routines.totals.availableToday)
    )).toBeVisible()
    await expect(page.getByRole("heading", { name: "Łączna pula punktów" }).locator("..").getByText(
      `${childSeedData.routines.totals.totalPointsToday} pkt`
    )).toBeVisible()
    await expect(page.getByRole("heading", { name: "Już ukończone" }).locator("..").getByText(
      String(childSeedData.routines.totals.completedToday)
    )).toBeVisible()

    await expect(page.getByRole("heading", { name: childSeedData.routines.today.name })).toBeVisible()
    await expect(page.getByRole("heading", { name: childSeedData.routines.upcoming.name })).toBeVisible()
    await expect(page.getByRole("heading", { name: childSeedData.routines.completed.name })).toBeVisible()
  })

  test("shows reward catalog with actionable redemption CTA", async ({
    page,
    childSessionCookies,
    childSeedData,
  }, testInfo) => {
    const baseURL = testInfo.project.use?.baseURL ?? BASE_URL_FALLBACK
    await applySupabaseSessionCookies(page, childSessionCookies, baseURL)

    await page.goto("/child/rewards")

    await expect(page.getByRole("heading", { name: "Na co chcesz wymienić punkty?" })).toBeVisible()
    await expect(
      page.getByText(`Aktualne saldo: ${childSeedData.walletBalance} pkt`, { exact: false })
    ).toBeVisible()
    await expect(page.getByRole("heading", { name: childSeedData.reward.name })).toBeVisible()
    await expect(page.getByText(`${childSeedData.reward.costPoints} pkt`)).toBeVisible()
    await expect(page.getByRole("button", { name: "Wymień punkty" })).toBeEnabled()
  })

  test("presents profile progress with achievements and recent routines", async ({
    page,
    childSessionCookies,
    childSeedData,
  }, testInfo) => {
    const baseURL = testInfo.project.use?.baseURL ?? BASE_URL_FALLBACK
    await applySupabaseSessionCookies(page, childSessionCookies, baseURL)

    await page.goto("/child/profile")

    await expect(page.getByRole("heading", { name: "Tak wygląda Twoja przygoda" })).toBeVisible()
    await expect(
      page.getByText(`Seria dni bez przerwy: ${childSeedData.streakDays}`, { exact: false })
    ).toBeVisible()
    await expect(page.getByRole("heading", { name: "Zdobyte odznaki" })).toBeVisible()
    await expect(page.getByText(childSeedData.achievement.name)).toBeVisible()
    await expect(page.getByRole("heading", { name: "Ostatnie rutyny" })).toBeVisible()
    await expect(page.getByRole("heading", { name: childSeedData.routines.completed.name })).toBeVisible()
  })
})
