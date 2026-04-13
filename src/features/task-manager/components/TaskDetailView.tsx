import type { Task } from '../types';
import { PriorityIndicator } from './PriorityIndicator';
import { StatusBadge } from './StatusBadge';
import { DueDateDisplay } from './DueDateDisplay';

interface TaskDetailViewProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function TaskDetailView({
  task,
  onEdit,
  onDelete,
  onBack,
}: TaskDetailViewProps) {
  const createdDate = new Date(task.createdAt).toLocaleDateString();
  const updatedDate = new Date(task.updatedAt).toLocaleDateString();

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {task.title}
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {task.description ?? 'No description'}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={task.status} />
          <PriorityIndicator priority={task.priority} />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm dark:border-gray-700">
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400">
              Created
            </span>
            <p className="mt-1 text-gray-900 dark:text-gray-100">
              {createdDate}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400">
              Updated
            </span>
            <p className="mt-1 text-gray-900 dark:text-gray-100">
              {updatedDate}
            </p>
          </div>
          {task.dueDate && (
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Due Date
              </span>
              <p className="mt-1 text-gray-900 dark:text-gray-100">
                <DueDateDisplay dueDate={task.dueDate} status={task.status} />
              </p>
            </div>
          )}
          {task.status === 'done' && task.completedAt && (
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Completed
              </span>
              <p className="mt-1 text-gray-900 dark:text-gray-100">
                {new Date(task.completedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
