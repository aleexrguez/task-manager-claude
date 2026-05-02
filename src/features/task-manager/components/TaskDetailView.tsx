import type { CreateTaskInput, Task } from '../types';
import { DueDateDisplay } from './DueDateDisplay';
import { PriorityIndicator } from './PriorityIndicator';
import { StatusBadge } from './StatusBadge';
import { TaskForm } from './TaskForm';

interface TaskDetailViewProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  isEditing?: boolean;
  onSave?: (data: CreateTaskInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isRecurring?: boolean;
  frequencyLabel?: string;
}

export function TaskDetailView({
  task,
  onEdit,
  onDelete,
  isEditing = false,
  onSave,
  onCancel,
  isSubmitting = false,
  isRecurring = false,
  frequencyLabel,
}: TaskDetailViewProps) {
  const createdDate = new Date(task.createdAt).toLocaleDateString();
  const updatedDate = new Date(task.updatedAt).toLocaleDateString();

  const initialValues: Partial<CreateTaskInput> = {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {isEditing ? (
        <div className="space-y-4">
          <TaskForm
            initialValues={initialValues}
            onSubmit={onSave ?? (() => {})}
            isSubmitting={isSubmitting}
            submitLabel="Save Changes"
          />
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {task.title}
            </h1>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={onEdit}
                className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Delete
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {task.description ?? 'No description'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={task.status} />
            <PriorityIndicator priority={task.priority} />
            {isRecurring && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Recurring
              </span>
            )}
            {isRecurring && frequencyLabel && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {frequencyLabel}
              </span>
            )}
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
      )}
    </div>
  );
}
