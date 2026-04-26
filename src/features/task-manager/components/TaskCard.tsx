import type { Task } from '../types';
import { isGeneratedTask } from '@/features/recurrences/utils/recurrence.utils';
import { StatusBadge } from './StatusBadge';
import { PriorityIndicator } from './PriorityIndicator';
import { DueDateDisplay } from './DueDateDisplay';

interface TaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onArchive?: (id: string) => void;
  isDeleting?: boolean;
}

export function TaskCard({
  task,
  onDelete,
  onClick,
  onArchive,
  isDeleting = false,
}: TaskCardProps) {
  const formattedDate = new Date(task.createdAt).toLocaleDateString();
  const recurring = isGeneratedTask(task);

  const cardContent = (
    <>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {task.title}
        </h3>
        <div className="pointer-events-auto flex shrink-0 gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          {!recurring && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              disabled={isDeleting}
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {isDeleting ? '...' : 'Delete'}
            </button>
          )}
          {task.status === 'done' && onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(task.id);
              }}
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {task.isArchived ? 'Unarchive' : 'Archive'}
            </button>
          )}
        </div>
      </div>

      {task.description && (
        <p className="mb-3 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={task.status} />
        <PriorityIndicator priority={task.priority} />
        {recurring && (
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            Recurring
          </span>
        )}
        {task.dueDate && (
          <DueDateDisplay dueDate={task.dueDate} status={task.status} />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
        <span className="shrink-0">{formattedDate}</span>
      </div>
      {task.status === 'done' && task.completedAt && (
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          <span className="font-medium">Completed</span>{' '}
          {new Date(task.completedAt).toLocaleString()}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <div
        data-task-id={task.id}
        className="group relative cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-700"
      >
        <button
          type="button"
          onClick={() => onClick(task.id)}
          className="absolute inset-0 z-0 cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label={task.title}
        />
        <div className="pointer-events-none relative">{cardContent}</div>
      </div>
    );
  }

  return (
    <div
      data-task-id={task.id}
      className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-700"
    >
      {cardContent}
    </div>
  );
}
