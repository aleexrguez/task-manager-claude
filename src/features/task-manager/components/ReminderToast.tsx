import type { GroupedReminder, ReminderTier } from '../types/reminder.types';

interface ReminderToastProps {
  reminder: GroupedReminder;
  onDismiss: (taskId: string) => void;
  onClick: (taskId: string) => void;
  onClickMore?: () => void;
}

const colorClasses: Record<ReminderTier, string> = {
  critical:
    'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
  urgent:
    'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
  warning:
    'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
};

function getDayLabel(daysRemaining: number): string {
  if (daysRemaining < 0) return 'Overdue';
  if (daysRemaining === 0) return 'Due today';
  return 'Tomorrow';
}

export function ReminderToast({
  reminder,
  onDismiss,
  onClick,
  onClickMore,
}: ReminderToastProps): JSX.Element {
  const { tier, topTask, extraCount } = reminder;
  const role = tier === 'critical' ? 'alert' : 'status';
  const dayLabel = getDayLabel(topTask.daysRemaining);

  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-md border-l-4 p-4 shadow-md ${colorClasses[tier]}`}
    >
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-75">
          {dayLabel}
        </span>
        <button
          type="button"
          className="truncate text-left text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          onClick={() => onClick(topTask.taskId)}
        >
          {topTask.taskTitle}
        </button>
        {extraCount > 0 && (
          <button
            type="button"
            className="text-left text-xs opacity-70 hover:opacity-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            onClick={onClickMore}
          >
            +{extraCount} more
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label={`Dismiss reminder: ${topTask.taskTitle}`}
        onClick={() => onDismiss(topTask.taskId)}
        className="shrink-0 text-sm font-medium opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        ✕
      </button>
    </div>
  );
}
