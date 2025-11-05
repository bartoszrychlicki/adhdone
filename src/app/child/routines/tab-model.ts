import type {
  ChildRoutineBoardData,
  ChildRoutinePreview,
  ChildRoutineSessionViewModel,
  ChildRoutineTask,
} from "@/lib/child/types"
import type { RoutineTab, RoutineTask } from "./components/ChildRoutineTabs"

type BuildTabsParams = {
  board: ChildRoutineBoardData
  sessions: ChildRoutineSessionViewModel[]
  timezone: string
  now?: Date
}

type RoutineSessionLookup = Map<string, ChildRoutineSessionViewModel>

type WindowRelation = "before" | "within" | "after" | "unknown"

const BADGE_LABELS: Record<RoutineTab["status"], string> = {
  active: "Dostępna teraz",
  upcoming: "Wkrótce",
  completed: "Ukończona",
}

function formatDateTimeInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes, fallback: string) =>
    parts.find((part) => part.type === type)?.value ?? fallback

  const year = get("year", "0000")
  const month = get("month", "01")
  const day = get("day", "01")
  const hour = get("hour", "00")
  const minute = get("minute", "00")
  const second = get("second", "00")

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

function formatTimeLabel(dateTime: string | null): string | null {
  if (!dateTime) return null
  const timePart = dateTime.split("T")[1]
  if (!timePart) return null
  const [hours, minutes] = timePart.split(":")
  if (!hours || !minutes) return null
  return `${hours}:${minutes}`
}

function formatWindowRange(preview: ChildRoutinePreview): string | null {
  const startLabel = formatTimeLabel(preview.startAt)
  const endLabel = formatTimeLabel(preview.endAt)

  if (startLabel && endLabel) {
    return `${startLabel} – ${endLabel}`
  }
  if (startLabel) {
    return startLabel
  }
  return null
}

function formatAvailability(
  preview: ChildRoutinePreview,
  status: RoutineTab["status"],
  relation: WindowRelation,
  isSecondaryToday: boolean
): string | null {
  if (status !== "upcoming") {
    return null
  }

  if (isSecondaryToday || relation === "within") {
    return "Ta rutyna będzie dostępna po ukończeniu aktualnej misji."
  }

  if (relation === "after") {
    const endLabel = formatTimeLabel(preview.endAt)
    if (endLabel) {
      return `Ta rutyna była dostępna do ${endLabel}. Spróbuj ponownie przy następnym terminie.`
    }
  }

  const timeLabel = formatTimeLabel(preview.startAt)
  if (timeLabel) {
    return `Ta rutyna jest teraz nieaktywna. Będzie dostępna o ${timeLabel}.`
  }

  return "Ta rutyna jest teraz nieaktywna. Będzie dostępna wkrótce."
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) {
    return null
  }
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    if (remainingMinutes === 0) {
      return `${hours} h`
    }
    return `${hours} h ${remainingMinutes} min`
  }

  return `${Math.max(1, minutes)} min`
}

function formatRelativeToNow(timestamp: string | null, now: Date): string | null {
  if (!timestamp) return null
  try {
    const target = new Date(timestamp)
    const diffMs = target.getTime() - now.getTime()
    const minutes = Math.round(diffMs / 60000)

    const rtf = new Intl.RelativeTimeFormat("pl-PL", { numeric: "auto" })
    if (Math.abs(minutes) < 60) {
      return rtf.format(minutes, "minute")
    }

    const hours = Math.round(minutes / 60)
    if (Math.abs(hours) < 24) {
      return rtf.format(hours, "hour")
    }

    const days = Math.round(hours / 24)
    return rtf.format(days, "day")
  } catch {
    return null
  }
}

function formatCompletionSummary(session: ChildRoutineSessionViewModel, now: Date): string | null {
  const relative = formatRelativeToNow(session.completedAt, now)
  const durationLabel = formatDuration(session.durationSeconds)

  if (!relative && !durationLabel) {
    return null
  }

  if (relative && durationLabel) {
    return `Ostatnio ukończono ${relative}. Czas wykonania: ${durationLabel}.`
  }

  if (relative) {
    return `Ostatnio ukończono ${relative}.`
  }

  return `Czas wykonania: ${durationLabel}.`
}

function toRoutineTask(task: ChildRoutineTask, inactive: boolean): RoutineTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: inactive ? "pending" : task.status,
    points: task.points,
    durationSeconds: task.durationSeconds,
    durationLabel: formatDuration(task.durationSeconds),
    isOptional: task.isOptional,
  }
}

function mapTasks(session: ChildRoutineSessionViewModel | undefined, inactive: boolean): RoutineTask[] {
  if (!session) {
    return []
  }
  return session.steps.map((task) => toRoutineTask(task, inactive))
}

function orderPreviews(board: ChildRoutineBoardData, activeSessionId: string | null): ChildRoutinePreview[] {
  const today = board.today
  const upcoming = board.upcoming
  const completed = board.completed

  const ordered: ChildRoutinePreview[] = []

  if (activeSessionId) {
    const current = today.find((preview) => preview.sessionId === activeSessionId)
    if (current) {
      ordered.push(current)
    }
  }

  ordered.push(
    ...today.filter((preview) => preview.sessionId !== activeSessionId),
    ...upcoming,
    ...completed
  )

  const seen = new Set<string>()
  return ordered.filter((preview) => {
    if (seen.has(preview.sessionId)) {
      return false
    }
    seen.add(preview.sessionId)
    return true
  })
}

function toRoutineTab(
  preview: ChildRoutinePreview,
  session: ChildRoutineSessionViewModel | undefined,
  activeSessionId: string | null,
  status: RoutineTab["status"],
  relation: WindowRelation,
  now: Date
): RoutineTab {
  const isActive = preview.sessionId === activeSessionId
  const inactive = status !== "active"
  const badgeBase = BADGE_LABELS[status]
  const timeLabel = formatTimeLabel(preview.startAt)
  const badgeLabel =
    status === "upcoming" && timeLabel ? `${badgeBase} ${timeLabel}` : badgeBase

  const isInProgress = Boolean(session?.status === "in_progress" || session?.startedAt)
  const tasks = mapTasks(session, inactive && status !== "completed")

  const totalTasks = tasks.length
  const mandatoryTaskIds = session
    ? session.steps.filter((step) => !step.isOptional).map((step) => step.id)
    : []
  const completedTaskIds = session
    ? session.steps.filter((step) => step.status === "completed").map((step) => step.id)
    : []

  let completionSummary = session ? formatCompletionSummary(session, now) : null

  if (!totalTasks) {
    const durationLabel = session ? formatDuration(session.durationSeconds) : null
    completionSummary = durationLabel ? `Brak zadań w tej rutynie. Ostatnio ukończono w ${durationLabel}.` : null
  }

  return {
    id: preview.sessionId,
    sessionId: preview.sessionId,
    name: preview.name,
    points: preview.pointsAvailable,
    status,
    startLabel: formatWindowRange(preview),
    badgeLabel,
    availabilityMessage: formatAvailability(preview, status, relation, !isActive && preview.status === "today"),
    completionSummary,
    tasks,
    isCurrent: isActive,
    isLocked: false,
    isInProgress,
    successHref: `/child/routines/${preview.sessionId}/success`,
    sessionStatus: session?.status ?? "scheduled",
    completedTasks: completedTaskIds.map((taskId) => ({ taskId, completedAt: undefined })),
    mandatoryTaskIds,
  }
}

export function buildChildRoutineTabsModel(params: BuildTabsParams): {
  tabs: RoutineTab[]
  activeSessionId: string | null
} {
  const now = params.now ?? new Date()
  const sessionMap: RoutineSessionLookup = new Map(
    params.sessions.map((session) => [session.id, session])
  )

  const orderedPreviews = orderPreviews(params.board, null)
  const nowLocalIso = formatDateTimeInTimezone(now, params.timezone)

  const contexts = orderedPreviews.map((preview) => {
    const session = sessionMap.get(preview.sessionId)
    const startAt = preview.startAt ?? null
    const endAt = preview.endAt ?? null

    let relation: WindowRelation = "unknown"
    if (startAt && nowLocalIso < startAt) {
      relation = "before"
    } else if (endAt && nowLocalIso > endAt) {
      relation = "after"
    } else if (startAt || endAt) {
      relation = "within"
    }

    let status: RoutineTab["status"]
    if (session?.status === "completed" || preview.status === "completed") {
      status = "completed"
    } else {
      status = relation === "within" || relation === "unknown" ? "active" : "upcoming"
    }

    return { preview, session, relation, status }
  })

  let activeAssigned = false
  contexts.forEach((context) => {
    if (context.status === "active") {
      if (activeAssigned) {
        context.status = "upcoming"
        context.relation = "within"
      } else {
        activeAssigned = true
      }
    }
  })

  const firstActive = contexts.find((context) => context.status === "active")
  const firstUpcoming = contexts.find((context) => context.status === "upcoming")
  const fallback = contexts[0]
  const activeSessionId = firstActive?.preview.sessionId ?? firstUpcoming?.preview.sessionId ?? fallback?.preview.sessionId ?? null

  const tabs = contexts.map((context) => {
    const { preview, session, relation, status } = context
    return toRoutineTab(preview, session, activeSessionId, status, relation, now)
  })

  const activeTab = tabs.find((tab) => tab.id === activeSessionId)
  const activeInProgress = activeTab?.isInProgress ?? false

  if (activeInProgress) {
    tabs.forEach((tab) => {
      if (tab.id !== activeSessionId) {
        tab.isLocked = true
      }
    })
  }

  return { tabs, activeSessionId }
}
