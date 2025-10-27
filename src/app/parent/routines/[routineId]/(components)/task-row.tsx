"use client"

import { useActionState } from "react"
import { AlertCircle, GripVertical } from "lucide-react"

import { updateTaskAction, type RoutineTaskUpdateState } from "../actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const initialState: RoutineTaskUpdateState = { status: "idle" }

type TaskRowProps = {
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
}

export function TaskRow({ task, routineId }: TaskRowProps) {
  const [state, formAction] = useActionState(updateTaskAction, initialState)

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4",
        task.isActive ? "opacity-100" : "opacity-60"
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 gap-3">
          <span className="mt-1 text-slate-500">
            <GripVertical className="size-4" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{task.name}</p>
            <p className="text-xs text-slate-300/80">{task.description ?? "Brak opisu"}</p>
            <p className="text-xs text-slate-400/80">Bieżąca pozycja: {task.position}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:w-80">
          <form action={formAction} className="flex flex-col gap-3 text-xs text-slate-200/80">
            <input type="hidden" name="routineId" value={routineId} />
            <input type="hidden" name="taskId" value={task.id} />
            <label className="flex flex-col gap-2">
              <span className="font-semibold text-white">Punkty</span>
              <Input name="points" type="number" min={0} defaultValue={task.points} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-semibold text-white">Pozycja zadania</span>
              <Input name="position" type="number" min={1} defaultValue={task.position} />
            </label>
            <label className="flex items-center gap-2">
              <Checkbox name="isOptional" value="true" defaultChecked={task.isOptional} className="mt-1" />
              Zadanie opcjonalne
            </label>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1">
                Zapisz zmiany
              </Button>
            </div>
          </form>
          {state.status === "error" ? (
            <Alert variant="destructive" className="border-red-500/40 bg-red-500/10 text-red-100">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Nie udało się zapisać</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          {state.status === "success" ? (
            <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100">
              Zmiany zapisane
            </Alert>
          ) : null}
        </div>
      </div>
    </div>
  )
}
