import type { RecurrenceTemplate } from '../types/recurrence.types';
import { formatFrequencyLabel } from '../utils/recurrence.utils';

interface RecurrenceCardProps {
  template: RecurrenceTemplate;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  medium:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function RecurrenceCard({
  template,
  onEdit,
  onDelete,
}: RecurrenceCardProps) {
  const frequencyLabel = formatFrequencyLabel(template);
  const priorityClass =
    PRIORITY_BADGE[template.priority] ?? PRIORITY_BADGE.medium;

  return (
    <div
      role="article"
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {template.title}
        </h3>
        <div className="flex shrink-0 gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(template.id)}
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(template.id)}
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
        {frequencyLabel}
      </p>

      {(template.leadTimeDays ?? 0) > 0 && (
        <p className="mb-3 text-xs text-indigo-500 dark:text-indigo-400">
          Generates {template.leadTimeDays} days early
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${priorityClass}`}
        >
          {template.priority}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            template.isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          {template.isActive ? 'Active' : 'Paused'}
        </span>
      </div>
    </div>
  );
}
