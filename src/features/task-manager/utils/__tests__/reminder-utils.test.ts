import { describe, it, expect } from 'vitest';
import type { Task } from '../../types/task.types';
import { computeReminders } from '../reminder.utils';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  title: 'Test task',
  status: 'todo',
  priority: 'medium',
  isArchived: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const TODAY = '2026-04-21';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeReminders', () => {
  it('returns empty array when no tasks are provided', () => {
    expect(computeReminders([], new Set(), TODAY)).toEqual([]);
  });

  it('returns empty array when all tasks have status "done"', () => {
    const tasks = [
      makeTask({ status: 'done', dueDate: '2026-04-20' }),
      makeTask({ status: 'done', dueDate: '2026-04-21' }),
    ];
    expect(computeReminders(tasks, new Set(), TODAY)).toEqual([]);
  });

  it('returns empty array when no tasks have a dueDate', () => {
    const tasks = [makeTask({ status: 'todo' }), makeTask({ status: 'in-progress' })];
    expect(computeReminders(tasks, new Set(), TODAY)).toEqual([]);
  });

  it('returns empty array when all due dates are >= 2 days away', () => {
    const tasks = [
      makeTask({ dueDate: '2026-04-23' }), // 2 days away
      makeTask({ dueDate: '2026-05-01' }), // far future
    ];
    expect(computeReminders(tasks, new Set(), TODAY)).toEqual([]);
  });

  it('returns a critical reminder for an overdue task (days < 0)', () => {
    const task = makeTask({ id: 'task-1', title: 'Overdue', dueDate: '2026-04-19' });
    const result = computeReminders([task], new Set(), TODAY);

    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe('critical');
    expect(result[0].topTask.taskId).toBe('task-1');
    expect(result[0].topTask.taskTitle).toBe('Overdue');
    expect(result[0].topTask.daysRemaining).toBe(-2);
    expect(result[0].extraCount).toBe(0);
  });

  it('returns an urgent reminder for a task due today (days === 0)', () => {
    const task = makeTask({ id: 'task-2', title: 'Due Today', dueDate: TODAY });
    const result = computeReminders([task], new Set(), TODAY);

    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe('urgent');
    expect(result[0].topTask.taskId).toBe('task-2');
    expect(result[0].topTask.daysRemaining).toBe(0);
    expect(result[0].extraCount).toBe(0);
  });

  it('returns a warning reminder for a task due tomorrow (days === 1)', () => {
    const task = makeTask({ id: 'task-3', title: 'Due Tomorrow', dueDate: '2026-04-22' });
    const result = computeReminders([task], new Set(), TODAY);

    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe('warning');
    expect(result[0].topTask.taskId).toBe('task-3');
    expect(result[0].topTask.daysRemaining).toBe(1);
    expect(result[0].extraCount).toBe(0);
  });

  it('excludes archived tasks (isArchived: true)', () => {
    const task = makeTask({ dueDate: '2026-04-20', isArchived: true });
    expect(computeReminders([task], new Set(), TODAY)).toEqual([]);
  });

  it('excludes tasks whose IDs are in dismissedTaskIds', () => {
    const task = makeTask({ id: 'dismissed-1', dueDate: '2026-04-20' });
    const dismissed = new Set(['dismissed-1']);
    expect(computeReminders([task], dismissed, TODAY)).toEqual([]);
  });

  it('orders results: critical before urgent before warning', () => {
    const tasks = [
      makeTask({ dueDate: '2026-04-22' }),   // warning (tomorrow)
      makeTask({ dueDate: TODAY }),           // urgent (today)
      makeTask({ dueDate: '2026-04-19' }),   // critical (overdue)
    ];
    const result = computeReminders(tasks, new Set(), TODAY);

    expect(result[0].tier).toBe('critical');
    expect(result[1].tier).toBe('urgent');
  });

  it('groups 4+ tasks in the same tier into a single entry with extraCount', () => {
    const tasks = [
      makeTask({ id: 'a', dueDate: '2026-04-19' }), // overdue -2
      makeTask({ id: 'b', dueDate: '2026-04-18' }), // overdue -3
      makeTask({ id: 'c', dueDate: '2026-04-17' }), // overdue -4
      makeTask({ id: 'd', dueDate: '2026-04-16' }), // overdue -5
    ];
    const result = computeReminders(tasks, new Set(), TODAY);

    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe('critical');
    expect(result[0].extraCount).toBe(3); // 4 tasks → topTask + 3 extra
    // most overdue = -5 → id 'd'
    expect(result[0].topTask.taskId).toBe('d');
    expect(result[0].topTask.daysRemaining).toBe(-5);
  });

  it('returns max 2 entries total: 3 tasks in same tier → 2 individual entries (capped)', () => {
    const tasks = [
      makeTask({ id: 'a', dueDate: '2026-04-19' }), // critical -2
      makeTask({ id: 'b', dueDate: '2026-04-18' }), // critical -3
      makeTask({ id: 'c', dueDate: '2026-04-17' }), // critical -4
    ];
    const result = computeReminders(tasks, new Set(), TODAY);

    expect(result).toHaveLength(2);
    result.forEach((r) => expect(r.tier).toBe('critical'));
    expect(result[0].topTask.daysRemaining).toBeLessThanOrEqual(result[1].topTask.daysRemaining);
  });

  it('shows both critical and urgent when each has 1 task (max 2)', () => {
    const tasks = [
      makeTask({ id: 'overdue', dueDate: '2026-04-20' }), // critical -1
      makeTask({ id: 'today',   dueDate: TODAY }),          // urgent 0
    ];
    const result = computeReminders(tasks, new Set(), TODAY);

    expect(result).toHaveLength(2);
    expect(result[0].tier).toBe('critical');
    expect(result[1].tier).toBe('urgent');
  });

  it('omits warning when critical + urgent already fill the 2-entry limit', () => {
    const tasks = [
      makeTask({ dueDate: '2026-04-20' }), // critical -1
      makeTask({ dueDate: TODAY }),          // urgent 0
      makeTask({ dueDate: '2026-04-22' }), // warning +1
    ];
    const result = computeReminders(tasks, new Set(), TODAY);

    expect(result).toHaveLength(2);
    expect(result.find((r) => r.tier === 'warning')).toBeUndefined();
  });

  it('selects the most overdue task as topTask when grouping', () => {
    const tasks = [
      makeTask({ id: 'less-overdue', dueDate: '2026-04-20' }), // -1
      makeTask({ id: 'more-overdue', dueDate: '2026-04-15' }), // -6
      makeTask({ id: 'mid-overdue',  dueDate: '2026-04-18' }), // -3
      makeTask({ id: 'least',        dueDate: '2026-04-19' }), // -2
    ];
    const result = computeReminders(tasks, new Set(), TODAY);

    expect(result).toHaveLength(1);
    expect(result[0].topTask.taskId).toBe('more-overdue');
    expect(result[0].topTask.daysRemaining).toBe(-6);
  });
});
