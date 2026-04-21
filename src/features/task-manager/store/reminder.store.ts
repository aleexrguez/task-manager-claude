import { create } from 'zustand';

interface ReminderStoreState {
  dismissedTaskIds: Set<string>;
  dismiss: (taskId: string) => void;
  clearDismissed: () => void;
}

export const useReminderStore = create<ReminderStoreState>((set) => ({
  dismissedTaskIds: new Set(),

  dismiss: (taskId) =>
    set((state) => ({
      dismissedTaskIds: new Set([...state.dismissedTaskIds, taskId]),
    })),

  clearDismissed: () => set({ dismissedTaskIds: new Set() }),
}));
