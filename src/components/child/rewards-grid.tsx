"use client"

import { useCallback, useState } from "react"
import { CheckCircle2, Loader2, Lock } from "lucide-react"
import type { ChildRewardViewModel } from "@/lib/child/types"
import { RewardImage } from "@/app/parent/rewards/reward-image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ChildRewardsGridProps = {
  rewards: ChildRewardViewModel[]
  childId: string
  familyId: string
  initialBalance: number
}

type FeedbackState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string }

function buildAuthHeaders(profileId: string, familyId: string) {
  return {
    "x-debug-profile-id": profileId,
    "x-debug-family-id": familyId,
    "x-debug-role": "child",
  }
}

export function ChildRewardsGrid({ rewards, childId, familyId, initialBalance }: ChildRewardsGridProps) {
  const [pointsBalance, setPointsBalance] = useState(initialBalance)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReward, setSelectedReward] = useState<ChildRewardViewModel | null>(null)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ status: "idle" })

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setPending(false)
  }, [])

  const handleRedeemClick = (reward: ChildRewardViewModel) => {
    setSelectedReward(reward)
    setFeedback({ status: "idle" })
    setDialogOpen(true)
  }

  const handleConfirmRedeem = async () => {
    if (!selectedReward) {
      return
    }

    setPending(true)
    setFeedback({ status: "idle" })

    try {
      const response = await fetch(`/api/v1/rewards/${selectedReward.id}/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(childId, familyId),
        },
        body: JSON.stringify({
          childProfileId: childId,
        }),
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => null)
        throw new Error(detail?.message ?? "Nie udało się wymienić nagrody.")
      }

      const data = await response.json()
      setPointsBalance(data.balanceAfter ?? pointsBalance)
      setFeedback({
        status: "success",
        message: `Nagroda „${selectedReward.name}” została zgłoszona do rodzica.`,
      })
      setDialogOpen(false)
    } catch (error) {
      setFeedback({
        status: "error",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {feedback.status === "success" ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 className="size-4" aria-hidden />
          <span>{feedback.message}</span>
        </div>
      ) : null}

      {feedback.status === "error" ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => {
          const canRedeem = reward.isActive && reward.costPoints <= pointsBalance
          const label = !reward.isActive
            ? "Nagroda ukryta"
            : reward.costPoints > pointsBalance
              ? "Za mało punktów"
              : "Wymień punkty"

          return (
            <div
              key={reward.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100 transition hover:border-teal-300/50"
            >
              <div className="relative h-36 w-full border-b border-slate-800/60">
                <RewardImage src={reward.imageUrl ?? undefined} alt={reward.name} />
              </div>
              <div className="space-y-1 p-4">
                <div className="flex items-center justify-between text-base font-semibold text-white">
                  <span>{reward.name}</span>
                  <span className="rounded-full border border-teal-400/40 bg-teal-500/15 px-3 py-1 text-xs text-teal-100">
                    {reward.costPoints} pkt
                  </span>
                </div>
                <p className="text-xs text-slate-200/70">
                  {reward.source === "template"
                    ? "Nagroda z szablonu"
                    : reward.source === "custom"
                      ? "Nagroda dodana przez rodzica"
                      : "Nagroda rodzinna"}
                </p>
              </div>
              <div className="mt-auto flex flex-col gap-3 p-4">
                <Button
                  size="sm"
                  disabled={!canRedeem || pending}
                  onClick={() => handleRedeemClick(reward)}
                  className="justify-center"
                >
                  {pending && selectedReward?.id === reward.id ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Wymieniam...
                    </>
                  ) : (
                    label
                  )}
                </Button>
                {!reward.isActive ? (
                  <p className="flex items-center gap-2 text-xs text-amber-200/80">
                    <Lock className="size-3.5" aria-hidden />
                    Rodzic ukrył tę nagrodę. Zapytaj, czy można ją odblokować.
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdź wymianę</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz wymienić {selectedReward?.costPoints ?? 0} punktów na nagrodę „
              {selectedReward?.name}”?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" onClick={closeDialog} disabled={pending}>
              Anuluj
            </Button>
            <Button onClick={handleConfirmRedeem} disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Wymieniam...
                </>
              ) : (
                "Potwierdź"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
