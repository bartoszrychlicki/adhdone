import { render, screen } from "@testing-library/react"

describe("App shell sanity check", () => {
  it("renders children in the test harness", () => {
    render(<p data-testid="smoke">Vitest ready</p>)
    expect(screen.getByTestId("smoke")).toHaveTextContent("Vitest ready")
  })
})
