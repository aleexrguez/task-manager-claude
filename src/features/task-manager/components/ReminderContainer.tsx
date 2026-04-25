import type { GroupedReminder } from '../types/reminder.types';
import { ReminderToast } from './ReminderToast';

interface ReminderContainerProps {
  reminders: GroupedReminder[];
  onDismiss: (taskId: string) => void;
  onClick: (taskId: string) => void;
  onClickMore?: () => void;
}

export function ReminderContainer({
  reminders,
  onDismiss,
  onClick,
  onClickMore,
}: ReminderContainerProps) {
  if (reminders.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Due date reminders"
      aria-live="assertive"
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-2"
    >
      {reminders.map((reminder) => (
        <ReminderToast
          key={reminder.topTask.taskId}
          reminder={reminder}
          onDismiss={onDismiss}
          onClick={onClick}
          onClickMore={onClickMore}
        />
      ))}
    </div>
  );
}
