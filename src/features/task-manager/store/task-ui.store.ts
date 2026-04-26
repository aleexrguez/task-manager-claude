import { create } from 'zustand';

import type {
  TaskPriority,
  TaskStatus,
  ViewMode,
} from '@/features/task-manager/types';

interface TaskUIState {
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  searchQuery: string;

  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  selectedTaskId: string | null;

  viewMode: ViewMode;
  showArchived: boolean;

  setStatusFilter: (status: TaskStatus | 'all') => void;
  setPriorityFilter: (priority: TaskPriority | 'all') => void;
  setSearchQuery: (query: string) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  closeEditModal: () => void;
  resetFilters: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleShowArchived: () => void;
}

const initialFilters = {
  statusFilter: 'all' as const,
  priorityFilter: 'all' as const,
  searchQuery: '',
};

function getInitialViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem('task-manager-view-mode');
    if (stored === 'list' || stored === 'board') {
      return stored;
    }
    return 'list';
  } catch {
    return 'list';
  }
}

function getInitialShowArchived(): boolean {
  try {
    const stored = localStorage.getItem('task-manager-show-archived');
    return stored === 'true';
  } catch {
    return false;
  }
}

export const useTaskUIStore = create<TaskUIState>((set) => ({
  ...initialFilters,

  isCreateModalOpen: false,
  isEditModalOpen: false,
  selectedTaskId: null,

  viewMode: getInitialViewMode(),
  showArchived: getInitialShowArchived(),

  setStatusFilter: (status) => set({ statusFilter: status }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  closeEditModal: () => set({ isEditModalOpen: false, selectedTaskId: null }),
  resetFilters: () => set(initialFilters),
  setViewMode: (mode) =>
    set(() => {
      try {
        localStorage.setItem('task-manager-view-mode', mode);
      } catch {
        // ignore
      }
      return { viewMode: mode };
    }),
  toggleShowArchived: () =>
    set((state) => {
      const next = !state.showArchived;
      try {
        localStorage.setItem('task-manager-show-archived', String(next));
      } catch {
        // ignore
      }
      return { showArchived: next };
    }),
}));
