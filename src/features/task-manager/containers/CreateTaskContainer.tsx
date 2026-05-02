import { useCreateTask } from '../hooks/use-tasks';
import { useTaskUIStore } from '../store/task-ui.store';
import { useToastStore } from '../store/toast.store';
import { TaskForm } from '../components';
import type { CreateTaskInput } from '../types';

export function CreateTaskContainer() {
  const isOpen = useTaskUIStore((s) => s.isCreateModalOpen);
  const closeCreateModal = useTaskUIStore((s) => s.closeCreateModal);
  const addToast = useToastStore((s) => s.addToast);
  const { mutate: createTask, isPending, isError, error } = useCreateTask();

  if (!isOpen) return null;

  function handleSubmit(data: CreateTaskInput): void {
    createTask(data, {
      onSuccess: () => {
        addToast('Task created', 'success');
        closeCreateModal();
      },
      onError: () => {
        addToast('Failed to create task', 'error');
      },
    });
  }

  const errorMessage = isError && error instanceof Error ? error.message : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            New Task
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={closeCreateModal}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            ✕
          </button>
        </div>
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400">
              {errorMessage}
            </p>
          </div>
        )}
        <TaskForm
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          submitLabel="Create Task"
          autoFocusTitle
        />
      </div>
    </div>
  );
}
