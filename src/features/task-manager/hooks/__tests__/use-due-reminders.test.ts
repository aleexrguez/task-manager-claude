import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import type { Task } from '../../types/task.types';
import { useAppPreferencesStore } from '@/shared/store/app-preferences.store';
import { useReminderStore } from '../../store/reminder.store';
import { useDueReminders } from '../use-due-reminders';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  title: 'Test task',
  status: 'todo',
  priority: 'medium',
  isArchived: false,
  position: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDueReminders', () => {
  beforeEach(() => {
    useAppPreferencesStore.setState({ remindersEnabled: true });
    useReminderStore.setState({ dismissedTaskIds: new Set() });
  });

  it('returns empty array when remindersEnabled is false', () => {
    useAppPreferencesStore.setState({ remindersEnabled: false });
    const task = makeTask({ dueDate: '2026-04-20' }); // overdue
    const { result } = renderHook(() => useDueReminders([task]));
    expect(result.current).toEqual([]);
  });

  it('returns reminders when remindersEnabled is true and tasks qualify', () => {
    const task = makeTask({ id: 'task-1', dueDate: '2026-04-20' }); // overdue
    const { result } = renderHook(() => useDueReminders([task]));
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current[0].tier).toBe('critical');
  });

  it('returns empty array when no tasks qualify', () => {
    const task = makeTask({ dueDate: '2026-05-01' }); // far future
    const { result } = renderHook(() => useDueReminders([task]));
    expect(result.current).toEqual([]);
  });

  it('excludes dismissed tasks', () => {
    const task = makeTask({ id: 'dismissed-task', dueDate: '2026-04-20' });
    useReminderStore.setState({
      dismissedTaskIds: new Set(['dismissed-task']),
    });
    const { result } = renderHook(() => useDueReminders([task]));
    expect(result.current).toEqual([]);
  });

  it('updates reminders when tasks change', () => {
    const tasks: Task[] = [];
    const { result, rerender } = renderHook(
      ({ t }: { t: Task[] }) => useDueReminders(t),
      { initialProps: { t: tasks } },
    );

    expect(result.current).toEqual([]);

    const newTasks = [makeTask({ id: 'new-task', dueDate: '2026-04-20' })];
    rerender({ t: newTasks });

    expect(result.current.length).toBeGreaterThan(0);
  });

  it('updates reminders when remindersEnabled toggles', () => {
    const task = makeTask({ dueDate: '2026-04-20' });
    const { result } = renderHook(() => useDueReminders([task]));

    expect(result.current.length).toBeGreaterThan(0);

    useAppPreferencesStore.getState().toggleReminders();

    // Re-render to pick up store change
    const { result: result2 } = renderHook(() => useDueReminders([task]));
    expect(result2.current).toEqual([]);
  });
});
