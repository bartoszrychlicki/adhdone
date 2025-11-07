import { render, screen } from "@testing-library/react"

import { RoutineMetricsBand } from "@/app/child/routines/components/RoutineMetricsBand"

describe("RoutineMetricsBand", () => {
  it("renders all metric cards with formatted values", () => {
    render(
      <RoutineMetricsBand
        totals={{
          availableToday: 2,
          totalPointsToday: 150,
          completedToday: 1,
          streakDays: 4,
        }}
      />
    )

    expect(screen.getByLabelText("Dostępne dziś")).toHaveTextContent("2")
    expect(screen.getByLabelText("Łączna pula punktów")).toHaveTextContent("150 pkt")
    expect(screen.getByLabelText("Już ukończone")).toHaveTextContent("1")
    expect(screen.getByLabelText("Aktualna seria")).toHaveTextContent("4 dni")
  })
})
