"use client"

import { useActionState } from "react"
import { AlertCircle } from "lucide-react"

import { updateChildTaskAction, type ChildTaskUpdateState } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

const updateInitialState: ChildTaskUpdateState = { status: "idle" }

type ChildTaskRowProps = {
  task: {
    id: string
    name: string
    description: string | null
    points: number
    position: number
    isOptional: boolean
    isActive: boolean
  }
  routineId: string
  childId: string
}

export function ChildTaskRow({ task, routineId, childId }: ChildTaskRowProps) {
  const [updateState, updateAction] = useActionState(updateChildTaskAction, updateInitialState)

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{task.name}</p>
          <p className="text-xs text-slate-300/80">{task.description ?? "Brak opisu"}</p>
          <p className="text-xs text-slate-400/80">Kolejność: {task.position}</p>
        </div>
        <div className="flex flex-col gap-3 md:w-80">
          <form action={updateAction} className="flex flex-col gap-3 text-xs text-slate-200/80">
            <input type="hidden" name="routineId" value={routineId} />
            <input type="hidden" name="childId" value={childId} />
            <input type="hidden" name="taskId" value={task.id} />
            <label className="flex flex-col gap-2">
              <span className="font-semibold text-white">Punkty dla dziecka</span>
              <Input name="points" type="number" min={0} defaultValue={task.points} />
            </label>
            <label className="flex items-center gap-2">
              <Checkbox name="isEnabled" value="true" defaultChecked={task.isActive} className="mt-1" />
              Zadanie aktywne
            </label>
            <Button type="submit" size="sm" className="self-start">
              Zapisz zmiany
            </Button>
          </form>
        </div>
      </div>

      {updateState.status === "error" ? (
        <Alert variant="destructive" className="mt-3 border-red-500/40 bg-red-500/10 text-red-100">
          <AlertCircle className="size-4" aria-hidden />
          <AlertTitle>Błąd zapisu</AlertTitle>
          <AlertDescription>{updateState.message}</AlertDescription>
        </Alert>
      ) : null}

      {updateState.status === "success" ? (
        <Alert className="mt-3 border-emerald-500/40 bg-emerald-500/10 text-emerald-100">
          Zmiany zapisane
        </Alert>
      ) : null}
    </div>
  )
}
