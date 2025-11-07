import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PointsBadge } from "@/components/child/points-badge"

describe("PointsBadge", () => {
  it("renders balance as plain badge when no link is provided", () => {
    render(<PointsBadge points={120} />)

    const badge = screen.getByText("120 pkt")
    expect(badge.closest("a")).toBeNull()
  })

  it("renders balance as link when href is provided", async () => {
    const user = userEvent.setup()
    render(<PointsBadge points={90} href="/child/rewards" />)

    const link = screen.getByRole("link", { name: /saldo punktów: 90 pkt/i })
    expect(link).toHaveAttribute("href", "/child/rewards")

    await user.click(link)
  })
})
