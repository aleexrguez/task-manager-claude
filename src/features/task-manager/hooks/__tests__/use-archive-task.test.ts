import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useArchiveTask, useUnarchiveTask } from '../../hooks';
import { taskKeys } from '../../hooks';
import { archiveTask, unarchiveTask } from '../../api';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../api', () => ({
  archiveTask: vi.fn(),
  unarchiveTask: vi.fn(),
  // Other exports that might be accessed through the module at import time
  fetchTasks: vi.fn(),
  fetchTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  purgeTasks: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<{ id: string }> = {}) {
  return {
    id: overrides.id ?? 'task-1',
    title: 'Test Task',
    status: 'done' as const,
    priority: 'medium' as const,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
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
// useArchiveTask
// ---------------------------------------------------------------------------

describe('useArchiveTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (archiveTask as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeTask({ id: 'task-1' }),
    );
  });

  it('calls archiveTask API with the provided ID', async () => {
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useArchiveTask(), { wrapper: Wrapper });

    result.current.mutate('task-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(archiveTask).toHaveBeenCalledWith('task-1');
  });

  it('invalidates task list queries on success', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useArchiveTask(), { wrapper: Wrapper });

    result.current.mutate('task-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: taskKeys.lists() }),
    );
  });

  it('invalidates task detail query for the specific ID on success', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useArchiveTask(), { wrapper: Wrapper });

    result.current.mutate('task-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: taskKeys.detail('task-1') }),
    );
  });

  it('optimistically sets isArchived to true in the cache', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const task = makeTask({ id: 'task-1' });
    queryClient.setQueryData(taskKeys.lists(), {
      tasks: [task],
      total: 1,
    });

    const { result } = renderHook(() => useArchiveTask(), { wrapper: Wrapper });

    result.current.mutate('task-1');

    await waitFor(() => {
      const cached = queryClient.getQueryData<{
        tasks: Array<{ id: string; isArchived: boolean }>;
      }>(taskKeys.lists());
      expect(cached?.tasks[0].isArchived).toBe(true);
    });
  });

  it('rolls back cache on error', async () => {
    (archiveTask as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error'),
    );
    const { queryClient, Wrapper } = createWrapper();
    const task = makeTask({ id: 'task-1' });
    queryClient.setQueryData(taskKeys.lists(), {
      tasks: [task],
      total: 1,
    });

    const { result } = renderHook(() => useArchiveTask(), { wrapper: Wrapper });

    result.current.mutate('task-1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<{
      tasks: Array<{ id: string; isArchived: boolean }>;
    }>(taskKeys.lists());
    expect(cached?.tasks[0].isArchived).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useUnarchiveTask
// ---------------------------------------------------------------------------

describe('useUnarchiveTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (unarchiveTask as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeTask({ id: 'task-2' }),
    );
  });

  it('calls unarchiveTask API with the provided ID', async () => {
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useUnarchiveTask(), {
      wrapper: Wrapper,
    });

    result.current.mutate('task-2');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(unarchiveTask).toHaveBeenCalledWith('task-2');
  });

  it('invalidates task list queries on success', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnarchiveTask(), {
      wrapper: Wrapper,
    });

    result.current.mutate('task-2');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: taskKeys.lists() }),
    );
  });

  it('invalidates task detail query for the specific ID on success', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnarchiveTask(), {
      wrapper: Wrapper,
    });

    result.current.mutate('task-2');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: taskKeys.detail('task-2') }),
    );
  });

  it('optimistically sets isArchived to false in the cache', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const task = { ...makeTask({ id: 'task-2' }), isArchived: true };
    queryClient.setQueryData(taskKeys.lists(), {
      tasks: [task],
      total: 1,
    });

    const { result } = renderHook(() => useUnarchiveTask(), {
      wrapper: Wrapper,
    });

    result.current.mutate('task-2');

    await waitFor(() => {
      const cached = queryClient.getQueryData<{
        tasks: Array<{ id: string; isArchived: boolean }>;
      }>(taskKeys.lists());
      expect(cached?.tasks[0].isArchived).toBe(false);
    });
  });

  it('rolls back cache on error', async () => {
    (unarchiveTask as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error'),
    );
    const { queryClient, Wrapper } = createWrapper();
    const task = { ...makeTask({ id: 'task-2' }), isArchived: true };
    queryClient.setQueryData(taskKeys.lists(), {
      tasks: [task],
      total: 1,
    });

    const { result } = renderHook(() => useUnarchiveTask(), {
      wrapper: Wrapper,
    });

    result.current.mutate('task-2');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<{
      tasks: Array<{ id: string; isArchived: boolean }>;
    }>(taskKeys.lists());
    expect(cached?.tasks[0].isArchived).toBe(true);
  });
});
