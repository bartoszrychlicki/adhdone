"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Circle, Play } from "lucide-react"

import type { ChildRoutineTask } from "@/lib/child/types"
import { cn } from "@/lib/utils"

type SequentialTaskListProps = {
  steps: ChildRoutineTask[]
  onCompleteChange?: (completedIds: string[]) => void
}

export function SequentialTaskList({ steps, onCompleteChange }: SequentialTaskListProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    steps.filter((step) => step.status === "completed").map((step) => step.id)
  )

  const orderedSteps = useMemo(() => steps ?? [], [steps])

  useEffect(() => {
    onCompleteChange?.(completedIds)
  }, [completedIds, onCompleteChange])

  useEffect(() => {
    setActiveIndex(0)
    const nextCompleted = orderedSteps.filter((step) => step.status === "completed").map((step) => step.id)
    setCompletedIds(nextCompleted)
  }, [orderedSteps])

  function markStepComplete(stepId: string) {
    if (completedIds.includes(stepId)) {
      return
    }

    setCompletedIds((prev) => {
      const next = [...prev, stepId]
      return next
    })
    setActiveIndex((prev) => Math.min(prev + 1, orderedSteps.length - 1))
  }

  return (
    <ol className="flex flex-col gap-3" aria-live="polite">
      {orderedSteps.map((step, index) => {
        const isActive = index === activeIndex
        const isCompleted = completedIds.includes(step.id)

        return (
          <li
            key={step.id}
            className={cn(
              "group relative flex gap-4 rounded-2xl border px-4 py-4 transition focus-within:ring-2 focus-within:ring-teal-300/60 focus:outline-hidden",
              isCompleted
                ? "border-emerald-500/40 bg-emerald-500/10"
                : isActive
                  ? "border-teal-500/50 bg-teal-500/10 shadow-lg shadow-teal-900/30"
                  : "border-slate-800/60 bg-slate-900/40"
            )}
          >
            <div className="mt-1 flex">
              {isCompleted ? (
                <CheckCircle2 className="size-5 text-emerald-300" aria-hidden />
              ) : isActive ? (
                <Play className="size-5 text-teal-200" aria-hidden />
              ) : (
                <Circle className="size-5 text-slate-500" aria-hidden />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  {step.description ? <p className="text-sm text-slate-200/80">{step.description}</p> : null}
                </div>
                <div className="flex flex-col items-end">
                  <span className="rounded-full border border-teal-400/40 bg-teal-500/10 px-3 py-1 text-xs text-teal-100">
                    +{step.points} pkt
                  </span>
                  {step.durationSeconds ? (
                    <span className="text-[11px] text-slate-300/80">
                      {Math.round(step.durationSeconds / 60)} min
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className={cn(
                  "self-start rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-300",
                  isCompleted
                    ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-100"
                    : "border border-teal-400/40 bg-teal-500/20 text-teal-100 hover:border-white/50"
                )}
                onClick={() => markStepComplete(step.id)}
                disabled={isCompleted}
              >
                {isCompleted ? "Gotowe" : "Zrobione"}
              </button>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
