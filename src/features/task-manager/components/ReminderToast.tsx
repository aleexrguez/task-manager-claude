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

const hoverClasses: Record<ReminderTier, string> = {
  critical: 'hover:bg-red-100 dark:hover:bg-red-900/80',
  urgent: 'hover:bg-amber-100 dark:hover:bg-amber-900/80',
  warning: 'hover:bg-blue-100 dark:hover:bg-blue-900/80',
};

const focusClasses: Record<ReminderTier, string> = {
  critical:
    'focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900',
  urgent:
    'focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900',
  warning:
    'focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900',
};

function getDayLabel(daysRemaining: number): string {
  if (daysRemaining < 0) return 'Overdue';
  if (daysRemaining === 0) return 'Due today';
  return 'Tomorrow';
}

function handleCardKeyDown(e: React.KeyboardEvent, callback: () => void): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    callback();
  }
}

export function ReminderToast({
  reminder,
  onDismiss,
  onClick,
  onClickMore,
}: ReminderToastProps) {
  const { tier, topTask, extraCount } = reminder;
  const role = tier === 'critical' ? 'alert' : 'status';
  const dayLabel = getDayLabel(topTask.daysRemaining);

  return (
    <div
      role={role}
      aria-label={`${dayLabel}: ${topTask.taskTitle}`}
      tabIndex={0}
      onClick={() => onClick(topTask.taskId)}
      onKeyDown={(e) => handleCardKeyDown(e, () => onClick(topTask.taskId))}
      className={[
        'relative flex w-80 cursor-pointer items-start gap-3 rounded-md border-l-4 p-4 pr-10 shadow-md outline-none transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md',
        colorClasses[tier],
        hoverClasses[tier],
        focusClasses[tier],
      ].join(' ')}
    >
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-75">
          {dayLabel}
        </span>
        <span className="truncate text-sm font-medium">
          {topTask.taskTitle}
        </span>
        {extraCount > 0 && (
          <button
            type="button"
            className="text-left text-xs opacity-70 underline hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onClickMore?.();
            }}
          >
            +{extraCount} more
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label={`Dismiss reminder: ${topTask.taskTitle}`}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(topTask.taskId);
        }}
        className="absolute right-3 top-3 shrink-0 rounded p-0.5 text-sm font-medium opacity-50 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
      >
        ✕
      </button>
    </div>
  );
}
