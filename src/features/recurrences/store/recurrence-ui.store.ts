import { create } from 'zustand';

interface RecurrenceUIState {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  selectedTemplateId: string | null;

  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (templateId: string) => void;
  closeEditModal: () => void;
}

export const useRecurrenceUIStore = create<RecurrenceUIState>((set) => ({
  isCreateModalOpen: false,
  isEditModalOpen: false,
  selectedTemplateId: null,

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  openEditModal: (templateId) =>
    set({ isEditModalOpen: true, selectedTemplateId: templateId }),
  closeEditModal: () =>
    set({ isEditModalOpen: false, selectedTemplateId: null }),
}));
