import type { Database } from "@/db/database.types"

export type RoutineSessionStatus = Database["public"]["Enums"]["routine_session_status"]

export type ChildRoutinePreview = {
  sessionId: string
  routineId: string
  name: string
  status: "today" | "upcoming" | "completed"
  startAt: string | null
  endAt: string | null
  pointsAvailable: number
}

export type ChildRoutineBoardData = {
  today: ChildRoutinePreview[]
  upcoming: ChildRoutinePreview[]
  completed: ChildRoutinePreview[]
}

export type ChildRoutineTask = {
  id: string
  title: string
  description: string | null
  points: number
  durationSeconds: number | null
  isOptional: boolean
  status: "completed" | "pending"
}

export type ChildRoutineSessionViewModel = {
  id: string
  routineId: string
  childProfileId: string
  routineName: string
  sessionDate: string
  status: RoutineSessionStatus
  startedAt: string | null
  plannedEndAt: string | null
  completedAt: string | null
  durationSeconds: number | null
  bestTimeBeaten: boolean
  totalPoints: number
  pointsAwarded: number
  steps: ChildRoutineTask[]
}

export type ChildRoutineSuccessSummary = {
  routineName: string
  totalTimeMinutes: number
  totalDurationSeconds: number | null
  pointsEarned: number
  pointsRecord?: number
  bestDurationSeconds?: number | null
  bestTimeBeaten: boolean
  badgesUnlocked: Array<{
    id: string
    name: string
    description?: string | null
  }>
  nextRoutine?: {
    sessionId: string
    name: string
    startAt: string | null
  }
}

export type ChildRewardViewModel = {
  id: string
  name: string
  description: string | null
  costPoints: number
  imageUrl?: string | null
  source?: "template" | "custom"
  isActive: boolean
  isRepeatable: boolean
}

export type ChildRewardsSnapshot = {
  balance: number
  rewards: ChildRewardViewModel[]
}

export type ChildAchievementViewModel = {
  id: string
  name: string
  description: string | null
  unlockedAt: string
  iconUrl: string | null
}

export type ChildRoutineHistoryItem = {
  id: string
  name: string
  completedAt: string
  pointsEarned: number
}

export type ChildProfileSnapshot = {
  streakDays: number
  totalPoints: number
  achievements: ChildAchievementViewModel[]
  routineHistory: ChildRoutineHistoryItem[]
}
