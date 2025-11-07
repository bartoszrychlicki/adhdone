type RoutineMetricsBandProps = {
  totals: {
    availableToday: number
    totalPointsToday: number
    completedToday: number
    streakDays: number
  }
}

const METRIC_DESCRIPTIONS: Record<string, string> = {
  "Dostępne dziś": "Misje, które możesz rozpocząć w tej chwili.",
  "Łączna pula punktów": "Suma punktów do zdobycia za dzisiejsze misje.",
  "Już ukończone": "Rutyny, które zostały zapisane jako zakończone dzisiaj.",
  "Aktualna seria": "Kolejne dni z ukończonymi rutynami.",
}

export function RoutineMetricsBand({ totals }: RoutineMetricsBandProps) {
  const metrics: Array<{ label: string; value: string; description: string }> = [
    {
      label: "Dostępne dziś",
      value: totals.availableToday.toString(),
      description: METRIC_DESCRIPTIONS["Dostępne dziś"],
    },
    {
      label: "Łączna pula punktów",
      value: `${totals.totalPointsToday} pkt`,
      description: METRIC_DESCRIPTIONS["Łączna pula punktów"],
    },
    {
      label: "Już ukończone",
      value: totals.completedToday.toString(),
      description: METRIC_DESCRIPTIONS["Już ukończone"],
    },
    {
      label: "Aktualna seria",
      value: `${totals.streakDays} dni`,
      description: METRIC_DESCRIPTIONS["Aktualna seria"],
    },
  ]

  return (
    <section
      aria-label="Dzisiejsze statystyki rutyn"
      className="grid gap-3 rounded-3xl border border-violet-500/30 bg-violet-950/50 p-4 text-white md:grid-cols-2 lg:grid-cols-4"
    >
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="flex flex-col gap-2 rounded-2xl border border-violet-500/20 bg-violet-900/40 p-4"
          aria-label={metric.label}
        >
          <span className="text-xs uppercase tracking-wide text-violet-200/70">{metric.label}</span>
          <span className="text-2xl font-semibold text-white">{metric.value}</span>
          <p className="text-sm text-violet-100/80">{metric.description}</p>
        </article>
      ))}
    </section>
  )
}
