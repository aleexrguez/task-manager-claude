import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAutoPurge } from '../../hooks';
import { useTaskUIStore } from '../../store';
import { purgeTasks } from '../../api';
import type { Task } from '../../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../api', () => ({
  purgeTasks: vi.fn(),
  // Prevent real API calls from hooks that might be imported transitively
  fetchTasks: vi.fn(),
  fetchTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  archiveTask: vi.fn(),
  unarchiveTask: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Returns an ISO datetime string that is `daysAgo` days in the past.
 */
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Task',
    status: 'todo',
    priority: 'medium',
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** A done task whose completedAt is old enough to be expired under a 7d policy. */
function makeExpiredTask(id: string): Task {
  return makeTask({
    id,
    status: 'done',
    completedAt: daysAgo(10), // 10 days ago — expired under 5d, 7d, 30d
  });
}

/** A done task completed recently — NOT expired under any policy. */
function makeFreshDoneTask(id: string): Task {
  return makeTask({
    id,
    status: 'done',
    completedAt: daysAgo(1), // 1 day ago — not expired even under 5d
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return { queryClient, Wrapper };
}

// ---------------------------------------------------------------------------
// useAutoPurge
// ---------------------------------------------------------------------------

describe('useAutoPurge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Always start with a safe default — no auto-purge
    useTaskUIStore.setState({ retentionPolicy: 'never' });
    (purgeTasks as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('does NOT call purgeTasks when retentionPolicy is "never"', async () => {
    useTaskUIStore.setState({ retentionPolicy: 'never' });

    const expiredTasks = [makeExpiredTask('t1'), makeExpiredTask('t2')];
    const { Wrapper } = createWrapper();

    renderHook(() => useAutoPurge(expiredTasks), { wrapper: Wrapper });

    // Give any async effects time to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(purgeTasks).not.toHaveBeenCalled();
  });

  it('does NOT call purgeTasks when tasks array is empty', async () => {
    useTaskUIStore.setState({ retentionPolicy: '7d' });

    const { Wrapper } = createWrapper();

    renderHook(() => useAutoPurge([]), { wrapper: Wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(purgeTasks).not.toHaveBeenCalled();
  });

  it('does NOT call purgeTasks when no tasks are expired (all within retention window)', async () => {
    useTaskUIStore.setState({ retentionPolicy: '7d' });

    const freshTasks = [makeFreshDoneTask('t1'), makeFreshDoneTask('t2')];
    const { Wrapper } = createWrapper();

    renderHook(() => useAutoPurge(freshTasks), { wrapper: Wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(purgeTasks).not.toHaveBeenCalled();
  });

  it('calls purgeTasks with expired task IDs when there are expired done tasks', async () => {
    useTaskUIStore.setState({ retentionPolicy: '7d' });

    const expiredTasks = [
      makeExpiredTask('expired-1'),
      makeExpiredTask('expired-2'),
    ];
    const freshTask = makeFreshDoneTask('fresh-1');
    const allTasks = [...expiredTasks, freshTask];

    const { Wrapper } = createWrapper();

    renderHook(() => useAutoPurge(allTasks), { wrapper: Wrapper });

    await waitFor(() => expect(purgeTasks).toHaveBeenCalledTimes(1));

    expect(purgeTasks).toHaveBeenCalledWith(
      expect.arrayContaining(['expired-1', 'expired-2']),
    );
    // Must NOT include the fresh task
    const calledWith = (purgeTasks as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string[];
    expect(calledWith).not.toContain('fresh-1');
  });

  it('does NOT call purgeTasks again on re-render with the same expired IDs', async () => {
    useTaskUIStore.setState({ retentionPolicy: '7d' });

    const expiredTasks = [makeExpiredTask('stable-1')];
    const { Wrapper } = createWrapper();

    const { rerender } = renderHook(
      ({ tasks }: { tasks: Task[] }) => useAutoPurge(tasks),
      { wrapper: Wrapper, initialProps: { tasks: expiredTasks } },
    );

    await waitFor(() => expect(purgeTasks).toHaveBeenCalledTimes(1));

    // Re-render with the exact same tasks reference — should NOT trigger a second purge
    rerender({ tasks: expiredTasks });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(purgeTasks).toHaveBeenCalledTimes(1);
  });

  it('calls purgeTasks again if the expired IDs change (new expired tasks appear)', async () => {
    useTaskUIStore.setState({ retentionPolicy: '7d' });

    const firstExpired = [makeExpiredTask('first-1')];
    const { Wrapper } = createWrapper();

    const { rerender } = renderHook(
      ({ tasks }: { tasks: Task[] }) => useAutoPurge(tasks),
      { wrapper: Wrapper, initialProps: { tasks: firstExpired } },
    );

    await waitFor(() => expect(purgeTasks).toHaveBeenCalledTimes(1));

    // A new expired task appears in the list
    const secondExpired = [
      makeExpiredTask('first-1'),
      makeExpiredTask('second-2'),
    ];
    rerender({ tasks: secondExpired });

    await waitFor(() => expect(purgeTasks).toHaveBeenCalledTimes(2));
  });

  it('calls purgeTasks again if retentionPolicy changes to a stricter value', async () => {
    // Start with 30d — task completed 20 days ago is NOT expired
    useTaskUIStore.setState({ retentionPolicy: '30d' });

    const taskCompletedTwentyDaysAgo = makeTask({
      id: 'borderline-1',
      status: 'done',
      completedAt: daysAgo(20),
    });

    const { Wrapper } = createWrapper();

    const { rerender } = renderHook(
      ({ tasks }: { tasks: Task[] }) => useAutoPurge(tasks),
      {
        wrapper: Wrapper,
        initialProps: { tasks: [taskCompletedTwentyDaysAgo] },
      },
    );

    // Under 30d policy, 20 days is not expired — no purge
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(purgeTasks).not.toHaveBeenCalled();

    // Switch to 7d policy — now 20 days IS expired → must trigger a purge
    act(() => {
      useTaskUIStore.setState({ retentionPolicy: '7d' });
    });

    rerender({ tasks: [taskCompletedTwentyDaysAgo] });

    await waitFor(() => expect(purgeTasks).toHaveBeenCalledTimes(1));
    expect(purgeTasks).toHaveBeenCalledWith(
      expect.arrayContaining(['borderline-1']),
    );
  });
});
