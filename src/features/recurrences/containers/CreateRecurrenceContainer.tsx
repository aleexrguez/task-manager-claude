import { useCreateRecurrence } from '../hooks/use-recurrences';
import { useRecurrenceUIStore } from '../store/recurrence-ui.store';
import { useToastStore } from '@/features/task-manager/store/toast.store';
import { RecurrenceForm } from '../components/RecurrenceForm';
import type { CreateRecurrenceInput } from '../types/recurrence.types';

export function CreateRecurrenceContainer() {
  const isOpen = useRecurrenceUIStore((s) => s.isCreateModalOpen);
  const closeCreateModal = useRecurrenceUIStore((s) => s.closeCreateModal);
  const addToast = useToastStore((s) => s.addToast);
  const { mutateAsync: createRecurrence, isPending } = useCreateRecurrence();

  if (!isOpen) return null;

  async function handleSubmit(data: CreateRecurrenceInput): Promise<void> {
    try {
      await createRecurrence(data);
      addToast('Recurrence created', 'success');
      closeCreateModal();
    } catch {
      addToast('Failed to create recurrence', 'error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            New Recurrence
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
        <RecurrenceForm
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          submitLabel="Submit"
        />
      </div>
    </div>
  );
}
