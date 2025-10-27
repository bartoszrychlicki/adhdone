import { Sparkles } from "lucide-react"

type PointsBadgeProps = {
  points: number
}

function formatPoints(points: number): string {
  try {
    return new Intl.NumberFormat("pl-PL").format(points)
  } catch {
    return points.toString()
  }
}

export function PointsBadge({ points }: PointsBadgeProps) {
  const formatted = formatPoints(points)

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/50 bg-teal-500/15 px-4 py-2 text-sm font-medium text-teal-100 shadow shadow-teal-900/30 backdrop-blur">
      <Sparkles className="size-4 text-teal-200" aria-hidden />
      <span aria-label={`${formatted} punktów`}>{formatted} pkt</span>
    </div>
  )
}

