import { create } from 'zustand';

import type {
  TaskPriority,
  TaskStatus,
  ViewMode,
  RetentionPolicy,
} from '@/features/task-manager/types';

interface TaskUIState {
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  searchQuery: string;

  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  selectedTaskId: string | null;

  isDarkMode: boolean;
  viewMode: ViewMode;
  retentionPolicy: RetentionPolicy;
  showArchived: boolean;

  setStatusFilter: (status: TaskStatus | 'all') => void;
  setPriorityFilter: (priority: TaskPriority | 'all') => void;
  setSearchQuery: (query: string) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (taskId: string) => void;
  closeEditModal: () => void;
  resetFilters: () => void;
  toggleDarkMode: () => void;
  setViewMode: (mode: ViewMode) => void;
  setRetentionPolicy: (policy: RetentionPolicy) => void;
  toggleShowArchived: () => void;
}

const initialFilters = {
  statusFilter: 'all' as const,
  priorityFilter: 'all' as const,
  searchQuery: '',
};

function getInitialDarkMode(): boolean {
  try {
    const stored = localStorage.getItem('task-manager-dark-mode');
    const isDark = stored === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    return isDark;
  } catch {
    return false;
  }
}

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

function getInitialRetentionPolicy(): RetentionPolicy {
  try {
    const stored = localStorage.getItem('task-manager-retention-policy');
    if (
      stored === '5d' ||
      stored === '7d' ||
      stored === '30d' ||
      stored === 'never'
    ) {
      return stored;
    }
    return 'never';
  } catch {
    return 'never';
  }
}

export const useTaskUIStore = create<TaskUIState>((set) => ({
  ...initialFilters,

  isCreateModalOpen: false,
  isEditModalOpen: false,
  selectedTaskId: null,

  isDarkMode: getInitialDarkMode(),
  viewMode: getInitialViewMode(),
  retentionPolicy: getInitialRetentionPolicy(),
  showArchived: false,

  setStatusFilter: (status) => set({ statusFilter: status }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  openEditModal: (taskId) =>
    set({ isEditModalOpen: true, selectedTaskId: taskId }),
  closeEditModal: () => set({ isEditModalOpen: false, selectedTaskId: null }),
  resetFilters: () => set(initialFilters),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      try {
        localStorage.setItem('task-manager-dark-mode', String(next));
      } catch {
        // ignore
      }
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDarkMode: next };
    }),
  setViewMode: (mode) =>
    set(() => {
      try {
        localStorage.setItem('task-manager-view-mode', mode);
      } catch {
        // ignore
      }
      return { viewMode: mode };
    }),
  setRetentionPolicy: (policy) =>
    set(() => {
      try {
        localStorage.setItem('task-manager-retention-policy', policy);
      } catch {
        // ignore
      }
      return { retentionPolicy: policy };
    }),
  toggleShowArchived: () =>
    set((state) => ({ showArchived: !state.showArchived })),
}));
