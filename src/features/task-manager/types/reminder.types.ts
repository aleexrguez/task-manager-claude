export type ReminderTier = 'critical' | 'urgent' | 'warning';

export interface Reminder {
  taskId: string;
  taskTitle: string;
  tier: ReminderTier;
  daysRemaining: number; // negative = overdue, 0 = today, 1 = tomorrow
}

export interface GroupedReminder {
  tier: ReminderTier;
  topTask: { taskId: string; taskTitle: string; daysRemaining: number };
  extraCount: number; // 0 means single task, >0 means grouped
}
