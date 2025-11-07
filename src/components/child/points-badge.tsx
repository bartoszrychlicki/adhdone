import Link from "next/link"
import { Sparkles } from "lucide-react"

type PointsBadgeProps = {
  points: number
  href?: string
}

function formatPoints(points: number): string {
  try {
    return new Intl.NumberFormat("pl-PL").format(points)
  } catch {
    return points.toString()
  }
}

export function PointsBadge({ points, href }: PointsBadgeProps) {
  const formatted = formatPoints(points)
  const content = (
    <>
      <Sparkles className="size-4 text-teal-200" aria-hidden />
      <span aria-label={`${formatted} punktów`}>{formatted} pkt</span>
    </>
  )

  const className =
    "inline-flex items-center gap-2 rounded-full border border-teal-400/50 bg-teal-500/15 px-4 py-2 text-sm font-medium text-teal-100 shadow shadow-teal-900/30 backdrop-blur transition hover:border-teal-300/70 hover:bg-teal-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`Saldo punktów: ${formatted} pkt`}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}
