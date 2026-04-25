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
import {
  fetchRecurrences,
  fetchRecurrenceById,
  createRecurrence,
  updateRecurrence,
  deleteRecurrence,
  generateTasks,
} from '../recurrence-api';

// Convenience alias — casts partial builder mocks to the full Supabase type
// without resorting to `as any` in individual tests.
function asFromReturn(
  partial: Record<string, unknown>,
): ReturnType<SupabaseClient['from']> {
  return partial as unknown as ReturnType<SupabaseClient['from']>;
}

// ---------------------------------------------------------------------------
// Helpers — build minimal DB rows for tests
// ---------------------------------------------------------------------------

function makeDbRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tmpl-uuid-001',
    user_id: 'user-123',
    title: 'Daily standup',
    description: null,
    priority: 'medium',
    frequency: 'daily',
    weekly_days: null,
    monthly_day: null,
    lead_time_days: 0,
    is_active: true,
    created_at: '2026-04-16T10:00:00.000Z',
    updated_at: '2026-04-16T10:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Group: fromDbRow mapping (via fetchRecurrences)
// ---------------------------------------------------------------------------

describe('fetchRecurrences — fromDbRow mapping', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it('maps a daily template DB row to the domain correctly', async () => {
    const dbRow = makeDbRow();

    const mockSelect = vi.fn().mockResolvedValue({
      data: [dbRow],
      error: null,
      count: 1,
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    const { recurrences, total } = await fetchRecurrences();

    expect(recurrences).toHaveLength(1);
    expect(recurrences[0]).toEqual({
      id: 'tmpl-uuid-001',
      title: 'Daily standup',
      description: undefined,
      priority: 'medium',
      frequency: 'daily',
      weeklyDays: undefined,
      monthlyDay: undefined,
      leadTimeDays: 0,
      isActive: true,
      createdAt: '2026-04-16T10:00:00.000Z',
      updatedAt: '2026-04-16T10:00:00.000Z',
    });
    expect(total).toBe(1);
  });

  it('maps a weekly template with weeklyDays array', async () => {
    const dbRow = makeDbRow({
      frequency: 'weekly',
      weekly_days: [1, 3, 5],
    });

    const mockSelect = vi.fn().mockResolvedValue({
      data: [dbRow],
      error: null,
      count: 1,
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    const { recurrences } = await fetchRecurrences();

    expect(recurrences[0].frequency).toBe('weekly');
    expect(recurrences[0].weeklyDays).toEqual([1, 3, 5]);
    expect(recurrences[0].monthlyDay).toBeUndefined();
  });

  it('maps a monthly template with monthlyDay', async () => {
    const dbRow = makeDbRow({
      frequency: 'monthly',
      monthly_day: 15,
    });

    const mockSelect = vi.fn().mockResolvedValue({
      data: [dbRow],
      error: null,
      count: 1,
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    const { recurrences } = await fetchRecurrences();

    expect(recurrences[0].frequency).toBe('monthly');
    expect(recurrences[0].monthlyDay).toBe(15);
    expect(recurrences[0].weeklyDays).toBeUndefined();
  });

  it('maps lead_time_days from DB row to leadTimeDays in domain', async () => {
    const dbRow = makeDbRow({
      frequency: 'monthly',
      monthly_day: 15,
      lead_time_days: 7,
    });

    const mockSelect = vi.fn().mockResolvedValue({
      data: [dbRow],
      error: null,
      count: 1,
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    const { recurrences } = await fetchRecurrences();

    expect(recurrences[0].leadTimeDays).toBe(7);
  });

  it('maps lead_time_days = 0 from DB row to leadTimeDays = 0', async () => {
    const dbRow = makeDbRow({ lead_time_days: 0 });

    const mockSelect = vi.fn().mockResolvedValue({
      data: [dbRow],
      error: null,
      count: 1,
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    const { recurrences } = await fetchRecurrences();

    expect(recurrences[0].leadTimeDays).toBe(0);
  });

  it('maps null optional fields to undefined (description, weeklyDays, monthlyDay)', async () => {
    const dbRow = makeDbRow({
      description: null,
      weekly_days: null,
      monthly_day: null,
    });

    const mockSelect = vi.fn().mockResolvedValue({
      data: [dbRow],
      error: null,
      count: 1,
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    const { recurrences } = await fetchRecurrences();

    expect(recurrences[0].description).toBeUndefined();
    expect(recurrences[0].weeklyDays).toBeUndefined();
    expect(recurrences[0].monthlyDay).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Group: toDbInsert mapping (via createRecurrence)
// ---------------------------------------------------------------------------

describe('createRecurrence — toDbInsert mapping', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it('creates a daily recurrence — weekly_days and monthly_day are null', async () => {
    const returnedRow = makeDbRow({ frequency: 'daily' });

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: returnedRow, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ insert: mockInsert }),
    );

    await createRecurrence({
      frequency: 'daily',
      title: 'Daily standup',
      priority: 'medium',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'daily',
        weekly_days: null,
        monthly_day: null,
      }),
    );
  });

  it('creates a weekly recurrence — weeklyDays mapped to weekly_days', async () => {
    const returnedRow = makeDbRow({ frequency: 'weekly', weekly_days: [1, 3] });

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: returnedRow, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ insert: mockInsert }),
    );

    await createRecurrence({
      frequency: 'weekly',
      title: 'Weekly review',
      priority: 'medium',
      weeklyDays: [1, 3],
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'weekly',
        weekly_days: [1, 3],
        monthly_day: null,
      }),
    );
  });

  it('creates a monthly recurrence with leadTimeDays — mapped to lead_time_days', async () => {
    const returnedRow = makeDbRow({
      frequency: 'monthly',
      monthly_day: 15,
      lead_time_days: 5,
    });

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: returnedRow, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ insert: mockInsert }),
    );

    await createRecurrence({
      frequency: 'monthly',
      title: 'Monthly report',
      priority: 'medium',
      monthlyDay: 15,
      leadTimeDays: 5,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'monthly',
        monthly_day: 15,
        lead_time_days: 5,
      }),
    );
  });

  it('creates a daily recurrence — lead_time_days defaults to 0', async () => {
    const returnedRow = makeDbRow({ frequency: 'daily', lead_time_days: 0 });

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: returnedRow, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ insert: mockInsert }),
    );

    await createRecurrence({
      frequency: 'daily',
      title: 'Daily standup',
      priority: 'medium',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_time_days: 0,
      }),
    );
  });

  it('creates a monthly recurrence — monthlyDay mapped to monthly_day', async () => {
    const returnedRow = makeDbRow({ frequency: 'monthly', monthly_day: 15 });

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: returnedRow, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ insert: mockInsert }),
    );

    await createRecurrence({
      frequency: 'monthly',
      title: 'Monthly report',
      priority: 'medium',
      monthlyDay: 15,
      leadTimeDays: 0,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'monthly',
        weekly_days: null,
        monthly_day: 15,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Group: CRUD operations
// ---------------------------------------------------------------------------

describe('CRUD operations', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it('fetchRecurrences returns list with count', async () => {
    const mockSelect = vi.fn().mockResolvedValue({
      data: [makeDbRow(), makeDbRow({ id: 'tmpl-uuid-002', title: 'Second' })],
      error: null,
      count: 2,
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    const result = await fetchRecurrences();

    expect(result.recurrences).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('fetchRecurrenceById returns single template', async () => {
    const dbRow = makeDbRow({ title: 'Specific template' });

    const mockSingle = vi.fn().mockResolvedValue({ data: dbRow, error: null });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    const result = await fetchRecurrenceById('tmpl-uuid-001');

    expect(result.id).toBe('tmpl-uuid-001');
    expect(result.title).toBe('Specific template');
    expect(mockEq).toHaveBeenCalledWith('id', 'tmpl-uuid-001');
  });

  it('updateRecurrence sends partial update', async () => {
    const updatedRow = makeDbRow({ title: 'Updated title', is_active: false });

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: updatedRow, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ update: mockUpdate }),
    );

    const result = await updateRecurrence('tmpl-uuid-001', {
      title: 'Updated title',
      isActive: false,
    });

    expect(result.title).toBe('Updated title');
    expect(result.isActive).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated title', is_active: false }),
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'tmpl-uuid-001');
  });

  it('updateRecurrence sends lead_time_days when leadTimeDays is provided', async () => {
    const updatedRow = makeDbRow({ lead_time_days: 7 });

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: updatedRow, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ update: mockUpdate }),
    );

    await updateRecurrence('tmpl-uuid-001', { leadTimeDays: 7 });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ lead_time_days: 7 }),
    );
  });

  it('deleteRecurrence deletes by id', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ delete: mockDelete }),
    );

    await expect(deleteRecurrence('tmpl-uuid-001')).resolves.toBeUndefined();
    expect(mockEq).toHaveBeenCalledWith('id', 'tmpl-uuid-001');
  });

  it('fetchRecurrences throws on error', async () => {
    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'DB connection failed' },
      count: null,
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ select: mockSelect }),
    );

    await expect(fetchRecurrences()).rejects.toThrow('DB connection failed');
  });

  it('createRecurrence throws on error', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Insert failed' },
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ insert: mockInsert }),
    );

    await expect(
      createRecurrence({
        frequency: 'daily',
        title: 'Failing',
        priority: 'medium',
      }),
    ).rejects.toThrow('Insert failed');
  });
});

// ---------------------------------------------------------------------------
// Group: generateTasks — batch insert
// ---------------------------------------------------------------------------

describe('generateTasks — batch insert', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it('skips when pending array is empty (no Supabase call)', async () => {
    await generateTasks([]);

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('inserts pending tasks with upsert and ignoreDuplicates: true', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ upsert: mockUpsert }),
    );

    await generateTasks([
      {
        templateId: 'tmpl-uuid-001',
        dateKey: '2026-04-16',
        title: 'Daily standup',
        priority: 'medium',
      },
    ]);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        onConflict: 'user_id,recurrence_template_id,recurrence_date_key',
        ignoreDuplicates: true,
      }),
    );
  });

  it('includes recurrence_template_id and recurrence_date_key in insert', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ upsert: mockUpsert }),
    );

    await generateTasks([
      {
        templateId: 'tmpl-uuid-001',
        dateKey: '2026-04-16',
        title: 'Daily standup',
        priority: 'medium',
      },
    ]);

    const [rows] = mockUpsert.mock.calls[0] as [Record<string, unknown>[]];
    expect(rows[0]).toMatchObject({
      recurrence_template_id: 'tmpl-uuid-001',
      recurrence_date_key: '2026-04-16',
      title: 'Daily standup',
      priority: 'medium',
      status: 'todo',
    });
  });

  it('sets due_date to the dateKey on each generated task', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ upsert: mockUpsert }),
    );

    await generateTasks([
      {
        templateId: 'tmpl-uuid-001',
        dateKey: '2026-04-17',
        title: 'Daily standup',
        priority: 'medium',
      },
      {
        templateId: 'tmpl-uuid-002',
        dateKey: '2026-04-18',
        title: 'Weekly review',
        priority: 'high',
      },
    ]);

    const [rows] = mockUpsert.mock.calls[0] as [Record<string, unknown>[]];
    expect(rows[0]).toMatchObject({ due_date: '2026-04-17' });
    expect(rows[1]).toMatchObject({ due_date: '2026-04-18' });
  });

  it('throws on supabase error', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({
      error: { message: 'Upsert failed' },
    });

    vi.mocked(supabase.from).mockReturnValue(
      asFromReturn({ upsert: mockUpsert }),
    );

    await expect(
      generateTasks([
        {
          templateId: 'tmpl-uuid-001',
          dateKey: '2026-04-16',
          title: 'Daily standup',
          priority: 'medium',
        },
      ]),
    ).rejects.toThrow('Upsert failed');
  });
});
