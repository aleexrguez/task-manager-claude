import { describe, it, expect, beforeEach } from 'vitest';
import { useReminderStore } from '../reminder.store';

describe('useReminderStore', () => {
  beforeEach(() => {
    useReminderStore.setState({ dismissedTaskIds: new Set() });
  });

  it('starts with an empty dismissedTaskIds set', () => {
    const { dismissedTaskIds } = useReminderStore.getState();
    expect(dismissedTaskIds.size).toBe(0);
  });

  it('dismiss() adds a task ID to the set', () => {
    useReminderStore.getState().dismiss('task-1');
    expect(useReminderStore.getState().dismissedTaskIds.has('task-1')).toBe(true);
  });

  it('dismiss() called twice with the same ID results in only one entry', () => {
    useReminderStore.getState().dismiss('task-1');
    useReminderStore.getState().dismiss('task-1');
    expect(useReminderStore.getState().dismissedTaskIds.size).toBe(1);
  });

  it('clearDismissed() resets the set to empty', () => {
    useReminderStore.getState().dismiss('task-1');
    useReminderStore.getState().dismiss('task-2');
    useReminderStore.getState().clearDismissed();
    expect(useReminderStore.getState().dismissedTaskIds.size).toBe(0);
  });

  it('multiple dismissals accumulate correctly', () => {
    useReminderStore.getState().dismiss('task-a');
    useReminderStore.getState().dismiss('task-b');
    useReminderStore.getState().dismiss('task-c');
    const { dismissedTaskIds } = useReminderStore.getState();
    expect(dismissedTaskIds.size).toBe(3);
    expect(dismissedTaskIds.has('task-a')).toBe(true);
    expect(dismissedTaskIds.has('task-b')).toBe(true);
    expect(dismissedTaskIds.has('task-c')).toBe(true);
  });
});
