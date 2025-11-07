import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { ChildRewardsGrid } from "@/components/child/rewards-grid"
import type { ChildRewardViewModel } from "@/lib/child/types"

const rewards: ChildRewardViewModel[] = [
  {
    id: "reward-1",
    name: "Seans filmowy",
    description: "Wieczór z ulubionym filmem.",
    costPoints: 40,
    imageUrl: null,
    source: "custom",
    isActive: true,
    isRepeatable: true,
  },
  {
    id: "reward-2",
    name: "Weekendowa wycieczka",
    description: "Dodatkowy spacer w weekend.",
    costPoints: 120,
    imageUrl: null,
    source: "template",
    isActive: true,
    isRepeatable: false,
  },
]

describe("ChildRewardsGrid", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("disables redemption when balance is insufficient", () => {
    render(<ChildRewardsGrid rewards={rewards} childId="child-1" familyId="family-1" initialBalance={30} />)

    const disabledButtons = screen.getAllByRole("button", { name: "Za mało punktów" })
    expect(disabledButtons).not.toHaveLength(0)
    disabledButtons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })

  it("confirms redemption and updates balance on success", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        balanceAfter: 45,
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    render(<ChildRewardsGrid rewards={rewards} childId="child-1" familyId="family-1" initialBalance={80} />)

    const redeemButton = screen.getByRole("button", { name: "Wymień punkty" })
    await user.click(redeemButton)

    const confirmButton = screen.getByRole("button", { name: "Potwierdź" })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/rewards/reward-1/redeem",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "x-debug-family-id": "family-1",
            "x-debug-profile-id": "child-1",
            "x-debug-role": "child",
          }),
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText(/Nagroda „Seans filmowy” została zgłoszona/i)).toBeVisible()
    })
  })
})
