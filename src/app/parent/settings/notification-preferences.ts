export type NotificationPreferences = {
  routineReminders: boolean
  rewardRedemptions: boolean
  weeklySummary: boolean
}

export const defaultNotificationPreferences: NotificationPreferences = {
  routineReminders: true,
  rewardRedemptions: true,
  weeklySummary: false,
}

export function extractNotificationPreferences(
  settings: Record<string, unknown> | null | undefined
): NotificationPreferences {
  if (!settings || typeof settings !== "object") {
    return { ...defaultNotificationPreferences }
  }

  const notificationsRaw = (settings as Record<string, unknown>).notifications
  if (typeof notificationsRaw !== "object" || notificationsRaw === null) {
    return { ...defaultNotificationPreferences }
  }

  const record = notificationsRaw as Record<string, unknown>

  return {
    routineReminders:
      typeof record.routineReminders === "boolean"
        ? record.routineReminders
        : defaultNotificationPreferences.routineReminders,
    rewardRedemptions:
      typeof record.rewardRedemptions === "boolean"
        ? record.rewardRedemptions
        : defaultNotificationPreferences.rewardRedemptions,
    weeklySummary:
      typeof record.weeklySummary === "boolean"
        ? record.weeklySummary
        : defaultNotificationPreferences.weeklySummary,
  }
}

