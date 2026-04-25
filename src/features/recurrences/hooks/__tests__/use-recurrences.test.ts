import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  useRecurrences,
  useRecurrence,
  useCreateRecurrence,
  useUpdateRecurrence,
  useDeleteRecurrence,
} from '../use-recurrences';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/features/auth/hooks', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../api/recurrence-api', () => ({
  fetchRecurrences: vi.fn(),
  fetchRecurrenceById: vi.fn(),
  createRecurrence: vi.fn(),
  updateRecurrence: vi.fn(),
  deleteRecurrence: vi.fn(),
  generateTasks: vi.fn(),
}));

import { useAuth } from '@/features/auth/hooks';
import {
  fetchRecurrences,
  fetchRecurrenceById,
  createRecurrence,
  updateRecurrence,
  deleteRecurrence,
} from '../../api/recurrence-api';
import type { RecurrenceTemplate } from '../../types/recurrence.types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-123', email: 'test@test.com' };

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
// useRecurrences
// ---------------------------------------------------------------------------

describe('useRecurrences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: MOCK_USER });
  });

  it('calls fetchRecurrences and returns data when user is authenticated', async () => {
    const templates = [makeTemplate()];
    (fetchRecurrences as ReturnType<typeof vi.fn>).mockResolvedValue({
      recurrences: templates,
      total: 1,
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRecurrences(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchRecurrences).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ recurrences: templates, total: 1 });
  });

  it('does NOT call fetchRecurrences when user is null', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRecurrences(), { wrapper: Wrapper });

    // Query is disabled — stays in loading with fetchStatus idle
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchRecurrences).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useRecurrence (single)
// ---------------------------------------------------------------------------

describe('useRecurrence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: MOCK_USER });
  });

  it('calls fetchRecurrenceById with the given id and returns data', async () => {
    const template = makeTemplate({ id: 'template-abc' });
    (fetchRecurrenceById as ReturnType<typeof vi.fn>).mockResolvedValue(
      template,
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRecurrence('template-abc'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchRecurrenceById).toHaveBeenCalledWith('template-abc');
    expect(result.current.data).toEqual(template);
  });

  it('does NOT call fetchRecurrenceById when user is null', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRecurrence('template-abc'), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchRecurrenceById).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useCreateRecurrence
// ---------------------------------------------------------------------------

describe('useCreateRecurrence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: MOCK_USER });
  });

  it('calls createRecurrence with the given input', async () => {
    const template = makeTemplate();
    (createRecurrence as ReturnType<typeof vi.fn>).mockResolvedValue(template);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateRecurrence(), {
      wrapper: Wrapper,
    });

    const input = {
      frequency: 'daily' as const,
      title: 'Daily standup',
      priority: 'medium' as const,
    };
    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createRecurrence).toHaveBeenCalledWith(input);
  });

  it('invalidates recurrence lists on success', async () => {
    const template = makeTemplate();
    (createRecurrence as ReturnType<typeof vi.fn>).mockResolvedValue(template);

    const { queryClient, Wrapper } = createWrapper();
    queryClient.invalidateQueries = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useCreateRecurrence(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      frequency: 'daily' as const,
      title: 'Daily standup',
      priority: 'medium' as const,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['recurrences']),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// useUpdateRecurrence
// ---------------------------------------------------------------------------

describe('useUpdateRecurrence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: MOCK_USER });
  });

  it('calls updateRecurrence with the given id and input', async () => {
    const template = makeTemplate({ title: 'Updated title' });
    (updateRecurrence as ReturnType<typeof vi.fn>).mockResolvedValue(template);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateRecurrence(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      id: 'template-1',
      input: { title: 'Updated title' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateRecurrence).toHaveBeenCalledWith('template-1', {
      title: 'Updated title',
    });
  });

  it('invalidates recurrence lists and the specific detail on success', async () => {
    const template = makeTemplate();
    (updateRecurrence as ReturnType<typeof vi.fn>).mockResolvedValue(template);

    const { queryClient, Wrapper } = createWrapper();
    queryClient.invalidateQueries = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateRecurrence(), {
      wrapper: Wrapper,
    });

    result.current.mutate({ id: 'template-1', input: { isActive: false } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Must invalidate the list
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['recurrences', 'list']),
      }),
    );
    // Must also invalidate the detail for the specific id
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining([
          'recurrences',
          'detail',
          'template-1',
        ]),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// useDeleteRecurrence
// ---------------------------------------------------------------------------

describe('useDeleteRecurrence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: MOCK_USER });
  });

  it('calls deleteRecurrence with the given id', async () => {
    (deleteRecurrence as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteRecurrence(), {
      wrapper: Wrapper,
    });

    result.current.mutate('template-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteRecurrence).toHaveBeenCalledWith('template-1');
  });

  it('invalidates recurrence lists AND task lists on success', async () => {
    (deleteRecurrence as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { queryClient, Wrapper } = createWrapper();
    queryClient.invalidateQueries = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRecurrence(), {
      wrapper: Wrapper,
    });

    result.current.mutate('template-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Must invalidate recurrence lists
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['recurrences']),
      }),
    );
    // Must ALSO invalidate task lists (cascade: deleting a template orphans tasks)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['tasks']) }),
    );
  });
});
