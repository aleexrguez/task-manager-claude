import type { Task } from '../types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onArchive?: (id: string) => void;
  isLoading?: boolean;
  deletingId?: string | null;
  emptyMessage?: string;
  onCreateNew?: () => void;
}

export function TaskList({
  tasks,
  onDelete,
  onClick,
  onArchive,
  isLoading = false,
  deletingId = null,
  emptyMessage = 'No tasks yet',
  onCreateNew,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-label="Loading tasks"
        aria-live="polite"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-3 h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mb-2 h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mb-4 h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="flex gap-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
        <div className="mb-3 text-4xl" aria-hidden="true">
          📋
        </div>
        <p className="text-base font-bold text-gray-700 dark:text-gray-300">
          {emptyMessage}
        </p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Create your first task to get started
        </p>
        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="cursor-pointer mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            New Task
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onDelete={onDelete}
          onClick={onClick}
          onArchive={onArchive}
          isDeleting={deletingId === task.id}
        />
      ))}
    </div>
  );
}
