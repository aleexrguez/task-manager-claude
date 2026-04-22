import { useEffect, useRef } from 'react';
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
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const activeIds = new Set(reminders.map((r) => r.topTask.taskId));

    // Clean up timers for reminders no longer visible
    for (const [taskId, timer] of timersRef.current) {
      if (!activeIds.has(taskId)) {
        clearTimeout(timer);
        timersRef.current.delete(taskId);
      }
    }

    // Create timers only for new reminders
    for (const r of reminders) {
      const taskId = r.topTask.taskId;
      if (timersRef.current.has(taskId)) continue;
      const ms = AUTO_DISMISS_MS[r.tier];
      if (ms !== null) {
        timersRef.current.set(
          taskId,
          setTimeout(() => {
            timersRef.current.delete(taskId);
            dismiss(taskId);
          }, ms),
        );
      }
    }
  }, [reminders, dismiss]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  if (reminders.length === 0) return null;

  return (
    <ReminderContainer
      reminders={reminders}
      onDismiss={dismiss}
      onClick={(taskId) =>
        navigate('/app/tasks', { state: { highlightTaskId: taskId } })
      }
      onClickMore={() => navigate('/app/tasks')}
    />
  );
}
