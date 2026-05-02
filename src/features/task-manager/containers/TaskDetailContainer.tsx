import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTask, useDeleteTask, useUpdateTask } from '../hooks/use-tasks';
import { useToastStore } from '../store/toast.store';
import { TaskDetailView } from '../components/TaskDetailView';
import { TaskNotFound } from '../components/TaskNotFound';
import { TaskErrorState } from '../components/TaskErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  isGeneratedTask,
  formatFrequencyLabel,
} from '@/features/recurrences/utils/recurrence.utils';
import { useRecurrence } from '@/features/recurrences/hooks/use-recurrences';
import type { CreateTaskInput } from '../types';

export function TaskDetailContainer() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: task, isLoading, isError, error, refetch } = useTask(id);

  const addToast = useToastStore((s) => s.addToast);

  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const recurring = task ? isGeneratedTask(task) : false;
  const { data: recurrenceTemplate } = useRecurrence(
    task?.recurrenceTemplateId ?? '',
  );
  const frequencyLabel = recurrenceTemplate
    ? formatFrequencyLabel(recurrenceTemplate)
    : undefined;

  function handleBack(): void {
    navigate('/app/tasks');
  }

  function handleEdit(): void {
    setIsEditing(true);
  }

  function handleSave(data: CreateTaskInput): void {
    if (!task) return;
    updateTask(
      { id: task.id, input: data },
      {
        onSuccess: () => {
          addToast('Task updated', 'success');
          setIsEditing(false);
        },
        onError: () => {
          addToast('Failed to update task', 'error');
        },
      },
    );
  }

  function handleCancel(): void {
    setIsEditing(false);
  }

  function handleDeleteRequest(): void {
    setShowConfirm(true);
  }

  function handleConfirmDelete(): void {
    if (!task) return;
    deleteTask(task.id, {
      onSuccess: () => {
        addToast('Task deleted', 'success');
        navigate('/app');
      },
      onError: () => {
        addToast('Failed to delete task', 'error');
        setShowConfirm(false);
      },
    });
  }

  function handleCancelDelete(): void {
    setShowConfirm(false);
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div
          role="status"
          aria-label="Loading task details"
          aria-live="polite"
          className="mx-auto max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="h-8 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      );
    }

    if (isError) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong.';

      if (message.startsWith('Task not found')) {
        return <TaskNotFound onBack={handleBack} />;
      }

      return <TaskErrorState message={message} onRetry={() => refetch()} />;
    }

    if (task) {
      return (
        <TaskDetailView
          task={task}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          isEditing={isEditing}
          onSave={handleSave}
          onCancel={handleCancel}
          isSubmitting={isUpdating}
          isRecurring={recurring}
          frequencyLabel={frequencyLabel}
        />
      );
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8" hidden={showConfirm}>
        <button
          onClick={handleBack}
          className="mb-4 inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &larr; Back to tasks
        </button>
        {renderContent()}
      </div>
      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
