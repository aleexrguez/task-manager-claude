import type { Task } from '../types/task.types';
import type { GroupedReminder, ReminderTier } from '../types/reminder.types';
import { getDueDateDaysRemaining } from './task.utils';

const MAX_ENTRIES = 2;
const GROUP_THRESHOLD = 4;

type TierEntry = {
  taskId: string;
  taskTitle: string;
  daysRemaining: number;
};

function assignTier(days: number): ReminderTier | null {
  if (days < 0) return 'critical';
  if (days === 0) return 'urgent';
  if (days === 1) return 'warning';
  return null;
}

/**
 * Computes which reminders to show given the current task list and dismissed IDs.
 * Pure function — accepts an optional `today` (YYYY-MM-DD) for deterministic testing.
 */
export function computeReminders(
  tasks: Task[],
  dismissedTaskIds: Set<string>,
  today?: string,
): GroupedReminder[] {
  // Step 1: filter eligible tasks
  const eligible = tasks.filter(
    (t) =>
      (t.status === 'todo' || t.status === 'in-progress') &&
      t.dueDate != null &&
      t.isArchived !== true &&
      !dismissedTaskIds.has(t.id),
  );

  // Step 2: compute days and assign tiers
  const tiered: Record<ReminderTier, TierEntry[]> = {
    critical: [],
    urgent: [],
    warning: [],
  };

  for (const task of eligible) {
    const days = getDueDateDaysRemaining(task.dueDate!, today);
    const tier = assignTier(days);
    if (tier !== null) {
      tiered[tier].push({
        taskId: task.id,
        taskTitle: task.title,
        daysRemaining: days,
      });
    }
  }

  // Step 3: build GroupedReminder entries for each tier
  const TIER_ORDER: ReminderTier[] = ['critical', 'urgent', 'warning'];
  const results: GroupedReminder[] = [];

  for (const tier of TIER_ORDER) {
    if (results.length >= MAX_ENTRIES) break;

    const entries = tiered[tier].sort(
      (a, b) => a.daysRemaining - b.daysRemaining,
    );
    if (entries.length === 0) continue;

    if (entries.length >= GROUP_THRESHOLD) {
      // Collapse into one entry
      results.push({
        tier,
        topTask: entries[0],
        extraCount: entries.length - 1,
      });
    } else {
      // Emit one entry per task, up to MAX_ENTRIES
      for (const entry of entries) {
        if (results.length >= MAX_ENTRIES) break;
        results.push({ tier, topTask: entry, extraCount: 0 });
      }
    }
  }

  return results;
}
