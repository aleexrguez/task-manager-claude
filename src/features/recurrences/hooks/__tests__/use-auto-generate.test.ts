import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAutoGenerate } from '../use-auto-generate';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../api/recurrence-api', () => ({
  generateTasks: vi.fn(),
  fetchRecurrences: vi.fn(),
  fetchRecurrenceById: vi.fn(),
  createRecurrence: vi.fn(),
  updateRecurrence: vi.fn(),
  deleteRecurrence: vi.fn(),
}));

vi.mock('../../utils/recurrence.utils', () => ({
  getPendingGenerations: vi.fn(),
}));

vi.mock('@/features/task-manager/hooks/task.keys', () => ({
  taskKeys: {
    all: ['tasks'] as const,
    lists: () => ['tasks', 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['tasks', 'list', filters] as const,
    details: () => ['tasks', 'detail'] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
}));

import { generateTasks } from '../../api/recurrence-api';
import { getPendingGenerations } from '../../utils/recurrence.utils';
import type { RecurrenceTemplate } from '../../types/recurrence.types';
import type { Task } from '@/features/task-manager/types/task.types';
import type { PendingGeneration } from '../../utils/recurrence.utils';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTemplate(
  overrides: Partial<RecurrenceTemplate> = {},
): RecurrenceTemplate {
  return {
    id: 'template-1',
    title: 'Daily standup',
    priority: 'medium',
    frequency: 'daily',
    leadTimeDays: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Task',
    status: 'todo',
    priority: 'medium',
    position: 0,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makePending(templateId: string, dateKey: string): PendingGeneration {
  return {
    templateId,
    dateKey,
    title: 'Daily standup',
    priority: 'medium',
  };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

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
// useAutoGenerate
// ---------------------------------------------------------------------------

describe('useAutoGenerate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (generateTasks as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (getPendingGenerations as ReturnType<typeof vi.fn>).mockReturnValue([]);
  });

  it('does NOT call generateTasks when getPendingGenerations returns empty', async () => {
    (getPendingGenerations as ReturnType<typeof vi.fn>).mockReturnValue([]);

    const templates = [makeTemplate()];
    const tasks = [makeTask()];
    const { Wrapper } = createWrapper();

    renderHook(() => useAutoGenerate(templates, tasks), { wrapper: Wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(generateTasks).not.toHaveBeenCalled();
  });

  it('calls generateTasks when there are pending generations', async () => {
    const pending = [makePending('template-1', '2026-04-16')];
    (getPendingGenerations as ReturnType<typeof vi.fn>).mockReturnValue(
      pending,
    );

    const templates = [makeTemplate()];
    const tasks: Task[] = [];
    const { Wrapper } = createWrapper();

    renderHook(() => useAutoGenerate(templates, tasks), { wrapper: Wrapper });

    await waitFor(() => expect(generateTasks).toHaveBeenCalledTimes(1));

    expect(generateTasks).toHaveBeenCalledWith(pending);
  });

  it('does NOT call generateTasks again on re-render with the same pending key', async () => {
    const pending = [makePending('template-1', '2026-04-16')];
    (getPendingGenerations as ReturnType<typeof vi.fn>).mockReturnValue(
      pending,
    );

    const templates = [makeTemplate()];
    const tasks: Task[] = [];
    const { Wrapper } = createWrapper();

    const { rerender } = renderHook(
      ({ t, k }: { t: RecurrenceTemplate[]; k: Task[] }) =>
        useAutoGenerate(t, k),
      { wrapper: Wrapper, initialProps: { t: templates, k: tasks } },
    );

    await waitFor(() => expect(generateTasks).toHaveBeenCalledTimes(1));

    // Re-render — same pending key, ref dedup must prevent a second call
    rerender({ t: templates, k: tasks });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(generateTasks).toHaveBeenCalledTimes(1);
  });

  it('calls generateTasks again when the pending key changes', async () => {
    const firstPending = [makePending('template-1', '2026-04-16')];
    (getPendingGenerations as ReturnType<typeof vi.fn>).mockReturnValue(
      firstPending,
    );

    const templates = [makeTemplate()];
    const tasks: Task[] = [];
    const { Wrapper } = createWrapper();

    const { rerender } = renderHook(
      ({ t, k }: { t: RecurrenceTemplate[]; k: Task[] }) =>
        useAutoGenerate(t, k),
      { wrapper: Wrapper, initialProps: { t: templates, k: tasks } },
    );

    await waitFor(() => expect(generateTasks).toHaveBeenCalledTimes(1));

    // New pending generation with a different templateId:dateKey
    const secondPending = [
      makePending('template-1', '2026-04-16'),
      makePending('template-2', '2026-04-16'),
    ];
    (getPendingGenerations as ReturnType<typeof vi.fn>).mockReturnValue(
      secondPending,
    );

    const newTemplates = [makeTemplate(), makeTemplate({ id: 'template-2' })];
    rerender({ t: newTemplates, k: tasks });

    await waitFor(() => expect(generateTasks).toHaveBeenCalledTimes(2));
    expect(generateTasks).toHaveBeenLastCalledWith(secondPending);
  });

  it('invalidates taskKeys.lists() after successful generation', async () => {
    const pending = [makePending('template-1', '2026-04-16')];
    (getPendingGenerations as ReturnType<typeof vi.fn>).mockReturnValue(
      pending,
    );
    (generateTasks as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { queryClient, Wrapper } = createWrapper();
    queryClient.invalidateQueries = vi.fn().mockResolvedValue(undefined);

    const templates = [makeTemplate()];
    const tasks: Task[] = [];

    renderHook(() => useAutoGenerate(templates, tasks), { wrapper: Wrapper });

    await waitFor(() => expect(generateTasks).toHaveBeenCalledTimes(1));
    // Give the .then() callback time to run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['tasks']) }),
    );
  });

  it('does NOT call generateTasks when templates array is empty', async () => {
    // Even if getPendingGenerations somehow returned something (it won't with empty templates),
    // let's assert the guard via the mock returning empty for empty templates
    (getPendingGenerations as ReturnType<typeof vi.fn>).mockReturnValue([]);

    const { Wrapper } = createWrapper();

    renderHook(() => useAutoGenerate([], []), { wrapper: Wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(generateTasks).not.toHaveBeenCalled();
  });
});
