import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock supabase — must come before any import that touches the module
vi.mock('@/shared/services/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

// Mock auth guard
vi.mock('@/shared/services/auth.guard', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue('user-123'),
}));

import { supabase } from '@/shared/services/supabase';
import { deleteTask, fetchTasks, reorderTasks } from '../supabase-api';

// Convenience alias — casts partial builder mocks to the full Supabase type
// without resorting to `as any` in individual tests.
function asFromReturn(
  partial: Record<string, unknown>,
): ReturnType<SupabaseClient['from']> {
  return partial as unknown as ReturnType<SupabaseClient['from']>;
}

// ---------------------------------------------------------------------------
// Helpers — build a minimal DB row for tests
// ---------------------------------------------------------------------------

function makeDbRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-abc',
    user_id: 'user-123',
    title: 'Test task',
    description: null,
    status: 'todo',
    priority: 'medium',
    due_date: null,
    completed_at: null,
    is_archived: false,
    created_at: '2026-04-16T10:00:00.000Z',
    updated_at: '2026-04-16T10:00:00.000Z',
    recurrence_template_id: null,
    recurrence_date_key: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Group: deleteTask — delete guard
// ---------------------------------------------------------------------------

describe('deleteTask', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it('deletes a regular task', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ delete: mockDelete }),
    );

    await expect(deleteTask('task-abc')).resolves.toBeUndefined();
    expect(mockEq).toHaveBeenCalledWith('id', 'task-abc');
  });

  it('deletes a recurring task without rejecting', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ delete: mockDelete }),
    );

    await expect(deleteTask('task-abc')).resolves.toBeUndefined();
    expect(mockEq).toHaveBeenCalledWith('id', 'task-abc');
  });

  it('throws when supabase returns an error', async () => {
    const mockEq = vi
      .fn()
      .mockResolvedValue({ error: { message: 'DB error' } });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ delete: mockDelete }),
    );

    await expect(deleteTask('task-abc')).rejects.toThrow('DB error');
  });
});

// ---------------------------------------------------------------------------
// Group: fromDbRow — recurrence field mapping (via fetchTasks)
// ---------------------------------------------------------------------------

describe('fetchTasks — recurrence field mapping', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it('maps recurrence fields from a DB row to the domain Task', async () => {
    // Arrange: DB row has populated recurrence fields
    const dbRow = makeDbRow({
      recurrence_template_id: 'tmpl-uuid-001',
      recurrence_date_key: '2026-04-16',
    });

    const mockSelect = vi.fn().mockResolvedValue({
      data: [dbRow],
      error: null,
      count: 1,
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    // Act
    const { tasks } = await fetchTasks();

    // Assert
    expect(tasks[0].recurrenceTemplateId).toBe('tmpl-uuid-001');
    expect(tasks[0].recurrenceDateKey).toBe('2026-04-16');
  });

  it('maps null recurrence fields to undefined in the domain Task', async () => {
    // Arrange: DB row has null recurrence fields (regular task)
    const dbRow = makeDbRow({
      recurrence_template_id: null,
      recurrence_date_key: null,
    });

    const mockSelect = vi.fn().mockResolvedValue({
      data: [dbRow],
      error: null,
      count: 1,
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    // Act
    const { tasks } = await fetchTasks();

    // Assert
    expect(tasks[0].recurrenceTemplateId).toBeUndefined();
    expect(tasks[0].recurrenceDateKey).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Group: reorderTasks — supabase API
// ---------------------------------------------------------------------------

describe('reorderTasks — supabase API', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it('is a no-op and resolves when given an empty array', async () => {
    await expect(reorderTasks([])).resolves.toBeUndefined();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('updates position for a single task without status change', async () => {
    // Arrange: no status change so the select for existing tasks is skipped
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ update: mockUpdate }),
    );

    // Act
    await reorderTasks([{ id: 'task-abc', position: 3 }]);

    // Assert
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ position: 3 }),
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'task-abc');
  });

  it('sets completed_at when status changes from non-done to done', async () => {
    // Arrange: fetch existing task (status: todo), then update succeeds
    const mockIn = vi.fn().mockResolvedValue({
      data: [makeDbRow({ id: 'task-abc', status: 'todo' })],
      error: null,
    });
    const mockSelectExisting = vi.fn().mockReturnValue({ in: mockIn });

    const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

    vi.mocked(supabase.from)
      .mockReturnValueOnce(asFromReturn({ select: mockSelectExisting }))
      .mockReturnValueOnce(asFromReturn({ update: mockUpdate }));

    // Act
    await reorderTasks([{ id: 'task-abc', position: 0, status: 'done' }]);

    // Assert: completed_at must be set in the update payload
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'done',
        completed_at: expect.any(String),
      }),
    );
  });

  it('throws when any individual update fails', async () => {
    // Arrange: no status change, update returns an error
    const mockEq = vi
      .fn()
      .mockResolvedValue({ error: { message: 'DB error' } });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ update: mockUpdate }),
    );

    // Act & Assert
    await expect(
      reorderTasks([{ id: 'task-abc', position: 1 }]),
    ).rejects.toThrow('DB error');
  });
});
