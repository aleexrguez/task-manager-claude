import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../types/task.types';
import { useDueReminders } from '../hooks/use-due-reminders';
import { useReminderStore } from '../store/reminder.store';
import { ReminderContainer } from '../components/ReminderContainer';
import type { ReminderTier } from '../types/reminder.types';

const AUTO_DISMISS_MS: Record<ReminderTier, number | null> = {
  critical: null,
  urgent: 10000,
  warning: 8000,
};

export function ReminderContainerCtrl({ tasks }: { tasks: Task[] }) {
  const reminders = useDueReminders(tasks);
  const dismiss = useReminderStore((s) => s.dismiss);
  const navigate = useNavigate();

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const r of reminders) {
      const ms = AUTO_DISMISS_MS[r.tier];
      if (ms !== null) {
        timers.push(setTimeout(() => dismiss(r.topTask.taskId), ms));
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [reminders, dismiss]);

  if (reminders.length === 0) return null;

  return (
    <ReminderContainer
      reminders={reminders}
      onDismiss={dismiss}
      onClick={() => navigate('/app/tasks')}
      onClickMore={() => navigate('/app/tasks')}
    />
  );
}
