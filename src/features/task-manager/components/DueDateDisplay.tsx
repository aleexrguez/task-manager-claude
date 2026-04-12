import type { TaskStatus } from '../types';
import { isDueDateOverdue } from '../utils';

interface DueDateDisplayProps {
  dueDate: string | undefined;
  status: TaskStatus;
  today?: string;
}

export function DueDateDisplay({
  dueDate,
  status,
  today,
}: DueDateDisplayProps) {
  if (!dueDate) return null;

  const overdue = isDueDateOverdue(dueDate, status, today);

  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span>{dueDate}</span>
      {overdue && (
        <span className="font-medium text-red-600 dark:text-red-400">
          Overdue
        </span>
      )}
    </span>
  );
}
