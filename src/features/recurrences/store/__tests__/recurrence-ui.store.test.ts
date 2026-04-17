import { describe, beforeEach, it, expect } from 'vitest';
import { useRecurrenceUIStore } from '../recurrence-ui.store';

describe('useRecurrenceUIStore', () => {
  beforeEach(() => {
    useRecurrenceUIStore.setState({
      isCreateModalOpen: false,
      isEditModalOpen: false,
      selectedTemplateId: null,
    });
  });

  it('starts with all modals closed', () => {
    const state = useRecurrenceUIStore.getState();
    expect(state.isCreateModalOpen).toBe(false);
    expect(state.isEditModalOpen).toBe(false);
    expect(state.selectedTemplateId).toBeNull();
  });

  it('openCreateModal sets isCreateModalOpen to true', () => {
    useRecurrenceUIStore.getState().openCreateModal();
    expect(useRecurrenceUIStore.getState().isCreateModalOpen).toBe(true);
  });

  it('closeCreateModal resets isCreateModalOpen to false', () => {
    useRecurrenceUIStore.getState().openCreateModal();
    useRecurrenceUIStore.getState().closeCreateModal();
    expect(useRecurrenceUIStore.getState().isCreateModalOpen).toBe(false);
  });

  it('openEditModal sets isEditModalOpen and selectedTemplateId', () => {
    useRecurrenceUIStore.getState().openEditModal('template-abc');
    const state = useRecurrenceUIStore.getState();
    expect(state.isEditModalOpen).toBe(true);
    expect(state.selectedTemplateId).toBe('template-abc');
  });

  it('closeEditModal clears isEditModalOpen and selectedTemplateId', () => {
    useRecurrenceUIStore.getState().openEditModal('template-abc');
    useRecurrenceUIStore.getState().closeEditModal();
    const state = useRecurrenceUIStore.getState();
    expect(state.isEditModalOpen).toBe(false);
    expect(state.selectedTemplateId).toBeNull();
  });
});
