import { useRecurrence, useUpdateRecurrence } from '../hooks/use-recurrences';
import { useRecurrenceUIStore } from '../store/recurrence-ui.store';
import { useToastStore } from '@/features/task-manager/store/toast.store';
import { RecurrenceForm } from '../components/RecurrenceForm';
import type { CreateRecurrenceInput } from '../types/recurrence.types';

export function EditRecurrenceContainer() {
  const isOpen = useRecurrenceUIStore((s) => s.isEditModalOpen);
  const selectedTemplateId = useRecurrenceUIStore((s) => s.selectedTemplateId);
  const closeEditModal = useRecurrenceUIStore((s) => s.closeEditModal);
  const addToast = useToastStore((s) => s.addToast);
  const { mutateAsync: updateRecurrence, isPending } = useUpdateRecurrence();

  const { data: template, isLoading } = useRecurrence(selectedTemplateId ?? '');

  if (!isOpen || !selectedTemplateId) return null;

  async function handleSubmit(data: CreateRecurrenceInput): Promise<void> {
    if (!selectedTemplateId) return;
    try {
      await updateRecurrence({ id: selectedTemplateId, input: data });
      addToast('Recurrence updated', 'success');
      closeEditModal();
    } catch {
      addToast('Failed to update recurrence', 'error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit Recurrence
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={closeEditModal}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            ✕
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <RecurrenceForm
            onSubmit={handleSubmit}
            initialValues={template}
            isSubmitting={isPending}
            submitLabel="Save Changes"
          />
        )}
      </div>
    </div>
  );
}
