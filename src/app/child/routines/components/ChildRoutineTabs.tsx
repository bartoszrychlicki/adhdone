"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type RoutineTaskStatus = "pending" | "completed"

export type RoutineTask = {
  id: string
  title: string
  description?: string | null
  status: RoutineTaskStatus
  points?: number
  durationSeconds?: number | null
  durationLabel?: string | null
  isOptional?: boolean
}

export type RoutineTabStatus = "active" | "upcoming" | "completed"

export type RoutineTab = {
  id: string
  sessionId: string
  name: string
  points: number
  status: RoutineTabStatus
  startLabel?: string | null
  badgeLabel: string
  availabilityMessage?: string | null
  completionSummary?: string | null
  tasks: RoutineTask[]
  isCurrent: boolean
  isLocked: boolean
  isInProgress: boolean
  successHref: string
  sessionStatus: string
  completedTasks: Array<{ taskId: string; completedAt?: string | null }>
  mandatoryTaskIds: string[]
}

export type ChildRoutineTabsProps = {
  tabs: RoutineTab[]
  onSelectTab?: (id: string) => void
}

function getInitialTabId(tabs: RoutineTab[]): string {
  if (tabs.length === 0) return ""
  const current = tabs.find((tab) => tab.isCurrent)
  return current?.id ?? tabs[0]!.id
}

export function ChildRoutineTabs({ tabs, onSelectTab }: ChildRoutineTabsProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(() => getInitialTabId(tabs))
  const [completionState, setCompletionState] = useState<Record<string, Record<string, string | null>>>(() =>
    Object.fromEntries(
      tabs.map((tab) => [tab.id, Object.fromEntries(tab.completedTasks.map((entry) => [entry.taskId, entry.completedAt ?? null]))])
    )
  )
  const [routineCompleted, setRoutineCompleted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tabs.map((tab) => [tab.id, tab.sessionStatus === "completed"]))
  )
  const [finishPending, setFinishPending] = useState<Record<string, boolean>>({})
  const [errorState, setErrorState] = useState<Record<string, string | null>>({})

  useEffect(() => {
    if (!tabs.length) {
      if (selectedId) {
        setSelectedId("")
      }
      return
    }

    const hasSelected = tabs.some((tab) => tab.id === selectedId)
    if (!hasSelected) {
      setSelectedId(getInitialTabId(tabs))
    }
  }, [tabs, selectedId])

  useEffect(() => {
    const initialCompletion = Object.fromEntries(
      tabs.map((tab) => [tab.id, Object.fromEntries(tab.completedTasks.map((entry) => [entry.taskId, entry.completedAt ?? null]))])
    )
    setCompletionState((prev) => {
      const next = { ...initialCompletion }
      for (const [tabId, completed] of Object.entries(prev)) {
        next[tabId] = { ...(initialCompletion[tabId] ?? {}), ...completed }
      }
      return next
    })
    setRoutineCompleted((prev) => {
      const base = Object.fromEntries(tabs.map((tab) => [tab.id, tab.sessionStatus === "completed"]))
      return { ...base, ...prev }
    })
  }, [tabs])

  useEffect(() => {
    if (selectedId) {
      onSelectTab?.(selectedId)
    }
  }, [selectedId, onSelectTab])

  const selectedTab = useMemo(() => tabs.find((tab) => tab.id === selectedId), [tabs, selectedId])

  if (!tabs.length) {
    return (
      <Card data-testid="child-routine-tabs-empty" className="border-slate-800/60 bg-slate-950/70 text-slate-100">
        <CardHeader>
          <CardTitle>Brak zaplanowanych rutyn</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">
            Wygląda na to, że nie masz jeszcze żadnych misji. Poproś rodzica o zaplanowanie rutyny lub spróbuj ponownie
            później.
          </p>
        </CardContent>
      </Card>
    )
  }

  const activeTabInProgress = Boolean(selectedTab?.isInProgress)

  const handleTabChange = (nextId: string) => {
    setSelectedId(nextId)
  }

  const markTaskCompleted = (tab: RoutineTab, taskId: string) => {
    setCompletionState((prev) => {
      const tabState = prev[tab.id] ?? {}
      if (tabState[taskId]) {
        return prev
      }
      return {
        ...prev,
        [tab.id]: {
          ...tabState,
          [taskId]: new Date().toISOString(),
        },
      }
    })
    setErrorState((prev) => ({ ...prev, [tab.id]: null }))
  }

  const handleFinishRoutine = async (tab: RoutineTab, allMandatoryCompleted: boolean, completionEntries: Array<{ taskId: string; completedAt: string | null }>) => {
    if (tab.status !== "active") {
      return
    }

    const alreadyCompleted = routineCompleted[tab.id] || tab.sessionStatus === "completed"

    if (alreadyCompleted) {
      router.push(tab.successHref)
      router.refresh()
      return
    }

    if (!allMandatoryCompleted) {
      return
    }

    if (!completionEntries.length && tab.tasks.length === 0) {
      router.push(tab.successHref)
      router.refresh()
      return
    }

    setFinishPending((prev) => ({ ...prev, [tab.id]: true }))
    setErrorState((prev) => ({ ...prev, [tab.id]: null }))

    try {
      const payload = {
        completedTasks: completionEntries.map((entry) => ({
          taskId: entry.taskId,
          completedAt: entry.completedAt ?? new Date().toISOString(),
        })),
        bestTimeBeaten: false,
      }

      const response = await fetch(`/api/v1/sessions/${tab.sessionId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Nie udało się zakończyć rutyny.")
      }

      setRoutineCompleted((prev) => ({ ...prev, [tab.id]: true }))
      router.push(tab.successHref)
      router.refresh()
    } catch (error) {
      setErrorState((prev) => ({
        ...prev,
        [tab.id]: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.",
      }))
    } finally {
      setFinishPending((prev) => ({ ...prev, [tab.id]: false }))
    }
  }

  return (
    <div data-testid="child-routine-tabs" className="flex flex-col gap-6">
      <Tabs value={selectedId} onValueChange={handleTabChange}>
        <TabsList aria-label="Wybierz rutynę" className="flex-wrap gap-2 bg-slate-950/40">
          {tabs.map((tab) => {
            const isSelected = tab.id === selectedId
            const shouldLock = tab.isLocked || (activeTabInProgress && !isSelected)

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={shouldLock}
                aria-disabled={shouldLock ? "true" : "false"}
                aria-label={`${tab.name} (${tab.points} pkt)`}
                className={cn(
                  "flex min-w-[200px] flex-col items-start gap-1 rounded-2xl border border-transparent px-5 py-3 text-left transition",
                  "data-[state=active]:border-teal-500/70 data-[state=active]:bg-slate-900 data-[state=inactive]:bg-slate-900/30",
                  shouldLock && "cursor-not-allowed opacity-60"
                )}
              >
                <span className="text-sm font-semibold text-white">{`${tab.name} (${tab.points} pkt)`}</span>
                <Badge
                  variant="outline"
                  aria-hidden="true"
                  className={cn(
                    "rounded-full border border-slate-700/70 px-2 py-0.5 text-[11px] uppercase tracking-wide",
                    tab.status === "active" && "border-teal-400/70 text-teal-200",
                    tab.status === "upcoming" && "border-indigo-400/70 text-indigo-200",
                    tab.status === "completed" && "border-emerald-400/70 text-emerald-200"
                  )}
                >
                  {tab.badgeLabel}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {tabs.map((tab) => {
          const completionMap = completionState[tab.id] ?? {}
          const completedSet = new Set(Object.keys(completionMap))
          const orderedTasks = tab.tasks
          const firstIncompleteIndex = orderedTasks.findIndex((task) => !completedSet.has(task.id))
          const activeIndex = firstIncompleteIndex === -1 ? null : firstIncompleteIndex
          const hasTasks = orderedTasks.length > 0
          const allMandatoryCompleted = tab.mandatoryTaskIds.every((taskId) => completedSet.has(taskId))
          const routineIsCompleted = routineCompleted[tab.id] || tab.sessionStatus === "completed"
          const finishDisabled = routineIsCompleted
            ? Boolean(finishPending[tab.id])
            : tab.status !== "active" || finishPending[tab.id] || !allMandatoryCompleted

          const completionEntries = Array.from(completedSet).map((taskId) => ({
            taskId,
            completedAt: completionMap[taskId] ?? null,
          }))

          return (
            <TabsContent key={tab.id} value={tab.id}>
              <div className="flex flex-col gap-6">
                {tab.availabilityMessage && (
                  <Card className="border-indigo-400/40 bg-indigo-500/10 text-indigo-50">
                    <CardContent className="py-4 text-sm">{tab.availabilityMessage}</CardContent>
                  </Card>
                )}

                {tab.completionSummary && (
                  <Card className="border-emerald-400/40 bg-emerald-500/10 text-emerald-50">
                    <CardContent className="py-4 text-sm">{tab.completionSummary}</CardContent>
                  </Card>
                )}

                <section aria-labelledby={`routine-${tab.id}-tasks`} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 id={`routine-${tab.id}-tasks`} className="text-lg font-semibold text-white">
                      Zadania
                    </h3>
                    {tab.startLabel && (
                      <span className="text-sm text-slate-300">
                        {tab.status === "active" ? "Okno czasowe" : "Plan"}: {tab.startLabel}
                      </span>
                    )}
                  </div>

                  <ul role="list" aria-label="Zadania rutyny" className="flex flex-col gap-3">
                    {hasTasks ? (
                      orderedTasks.map((task, index) => {
                        const isCompleted = completedSet.has(task.id) || task.status === "completed"
                        const isInactive = tab.status !== "active"
                        const isActiveTask = !isInactive && activeIndex === index
                        const disableAction =
                          isInactive || isCompleted || (activeIndex !== null && index !== activeIndex)

                        return (
                          <li
                            key={task.id}
                            role="listitem"
                            aria-label={isCompleted ? "Zadanie ukończone" : undefined}
                            data-status={isCompleted ? "completed" : "pending"}
                            data-inactive={isInactive ? "true" : undefined}
                            className={cn(
                              "flex items-center justify-between gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/50 px-4 py-3 transition",
                              isInactive && "pointer-events-none opacity-60",
                              isCompleted && "border-emerald-500/50 bg-emerald-500/10",
                              !isInactive && isActiveTask && "border-teal-400/60 bg-teal-500/10"
                            )}
                          >
                            <div className="flex flex-1 flex-col gap-1">
                              <span className="text-sm font-medium text-slate-100">{task.title}</span>
                              {task.description ? (
                                <span className="text-xs text-slate-300/80">{task.description}</span>
                              ) : null}
                              <div className="text-xs text-slate-400">
                                {task.points ? `${task.points} pkt` : null}
                                {task.points && task.durationLabel ? " • " : null}
                                {task.durationLabel}
                                {task.isOptional ? " • Opcjonalne" : null}
                              </div>
                            </div>
                            {tab.status === "active" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant={isCompleted ? "secondary" : "outline"}
                                className={cn(
                                  "rounded-full px-4",
                                  isCompleted
                                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-100"
                                    : "border-teal-400/40 bg-teal-500/10 text-teal-100"
                                )}
                                disabled={disableAction}
                                onClick={() => markTaskCompleted(tab, task.id)}
                              >
                                {isCompleted ? "Gotowe" : "Zrobione"}
                              </Button>
                            ) : null}
                          </li>
                        )
                      })
                    ) : (
                      <li
                        role="listitem"
                        data-empty="true"
                        className="rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-300"
                      >
                        Brak zadań w tej rutynie. Ostatnio ukończono w {tab.completionSummary ?? "nieznanym czasie"}.
                      </li>
                    )}
                  </ul>
                </section>

                {(tab.status === "active" || routineIsCompleted) && (
                  <footer
                    role="region"
                    aria-label="Panel zakończenia rutyny"
                    className="sticky bottom-0 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-lg shadow-black/30 backdrop-blur"
                  >
                    <div className="flex flex-col gap-3">
                      <Button
                        type="button"
                        className="w-full"
                        disabled={finishDisabled}
                        onClick={() => handleFinishRoutine(tab, allMandatoryCompleted, completionEntries)}
                      >
                        {routineIsCompleted ? "Przejdź dalej" : "Zakończ rutynę"}
                      </Button>
                      {errorState[tab.id] ? (
                        <p className="text-sm text-rose-200/90">{errorState[tab.id]}</p>
                      ) : null}
                    </div>
                  </footer>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
