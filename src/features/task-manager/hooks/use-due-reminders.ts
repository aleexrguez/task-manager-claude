import { useMemo } from 'react';
import type { Task } from '../types/task.types';
import type { GroupedReminder } from '../types/reminder.types';
import { useAppPreferencesStore } from '@/shared/store/app-preferences.store';
import { useReminderStore } from '../store/reminder.store';
import { computeReminders } from '../utils/reminder.utils';

export function useDueReminders(tasks: Task[]): GroupedReminder[] {
  const remindersEnabled = useAppPreferencesStore((s) => s.remindersEnabled);
  const dismissedTaskIds = useReminderStore((s) => s.dismissedTaskIds);

  return useMemo(() => {
    if (!remindersEnabled) return [];
    return computeReminders(tasks, dismissedTaskIds);
  }, [tasks, remindersEnabled, dismissedTaskIds]);
}
