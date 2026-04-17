import type { Task, RetentionPolicy } from '../../types';
import {
  sortTasks,
  groupTasksByStatus,
  getExpiredTaskIds,
  filterVisibleTasks,
  isDueDateOverdue,
  getDueDateDaysRemaining,
} from '../../utils';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let _idCounter = 0;

function makeTask(overrides: Partial<Task> = {}): Task {
  _idCounter += 1;
  const base: Task = {
    id: `00000000-0000-0000-0000-${String(_idCounter).padStart(12, '0')}`,
    title: `Task ${_idCounter}`,
    status: 'todo',
    priority: 'medium',
    isArchived: false,
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-01-10T10:00:00.000Z',
  };
  return { ...base, ...overrides };
}

beforeEach(() => {
  _idCounter = 0;
});

// ---------------------------------------------------------------------------
// 1. sortTasks
// ---------------------------------------------------------------------------

describe('sortTasks', () => {
  it('sorts tasks by priority descending: high before medium before low', () => {
    const low = makeTask({ priority: 'low' });
    const high = makeTask({ priority: 'high' });
    const medium = makeTask({ priority: 'medium' });

    const result = sortTasks([low, high, medium]);

    expect(result[0].priority).toBe('high');
    expect(result[1].priority).toBe('medium');
    expect(result[2].priority).toBe('low');
  });

  it('breaks priority tie by dueDate ascending: earlier dueDate comes first', () => {
    const later = makeTask({ priority: 'high', dueDate: '2024-03-01' });
    const earlier = makeTask({ priority: 'high', dueDate: '2024-01-15' });

    const result = sortTasks([later, earlier]);

    expect(result[0].id).toBe(earlier.id);
    expect(result[1].id).toBe(later.id);
  });

  it('places tasks WITHOUT dueDate after tasks WITH dueDate when priority is equal', () => {
    const withDue = makeTask({ priority: 'medium', dueDate: '2024-06-01' });
    const withoutDue = makeTask({ priority: 'medium' });

    const result = sortTasks([withoutDue, withDue]);

    expect(result[0].id).toBe(withDue.id);
    expect(result[1].id).toBe(withoutDue.id);
  });

  it('breaks dueDate tie by createdAt descending: newer createdAt comes first', () => {
    const older = makeTask({
      priority: 'low',
      dueDate: '2024-05-01',
      createdAt: '2024-01-01T08:00:00.000Z',
    });
    const newer = makeTask({
      priority: 'low',
      dueDate: '2024-05-01',
      createdAt: '2024-01-20T08:00:00.000Z',
    });

    const result = sortTasks([older, newer]);

    expect(result[0].id).toBe(newer.id);
    expect(result[1].id).toBe(older.id);
  });

  it('applies all three tiebreakers correctly in a mixed scenario', () => {
    const a = makeTask({
      priority: 'high',
      dueDate: '2024-02-01',
      createdAt: '2024-01-05T00:00:00.000Z',
    });
    const b = makeTask({
      priority: 'high',
      dueDate: '2024-02-01',
      createdAt: '2024-01-10T00:00:00.000Z',
    });
    const c = makeTask({ priority: 'high' }); // no dueDate → goes last among high
    const d = makeTask({ priority: 'medium', dueDate: '2024-01-01' });
    const e = makeTask({ priority: 'low' });

    const result = sortTasks([e, c, d, a, b]);

    // high priority first; among high: due '2024-02-01' first (two tasks, newest createdAt first)
    expect(result[0].id).toBe(b.id); // high, has due, newer
    expect(result[1].id).toBe(a.id); // high, has due, older
    expect(result[2].id).toBe(c.id); // high, no due
    expect(result[3].id).toBe(d.id); // medium
    expect(result[4].id).toBe(e.id); // low
  });

  it('returns an empty array when given an empty array', () => {
    expect(sortTasks([])).toEqual([]);
  });

  it('returns a single-element array unchanged', () => {
    const task = makeTask();
    const result = sortTasks([task]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(task.id);
  });

  it('does NOT mutate the original array', () => {
    const tasks = [
      makeTask({ priority: 'low' }),
      makeTask({ priority: 'high' }),
    ];
    const originalOrder = tasks.map((t) => t.id);

    sortTasks(tasks);

    expect(tasks.map((t) => t.id)).toEqual(originalOrder);
  });
});

// ---------------------------------------------------------------------------
// 2. groupTasksByStatus
// ---------------------------------------------------------------------------

describe('groupTasksByStatus', () => {
  it('groups tasks correctly into the three status buckets', () => {
    const todo1 = makeTask({ status: 'todo' });
    const todo2 = makeTask({ status: 'todo' });
    const inProgress = makeTask({ status: 'in-progress' });
    const done = makeTask({ status: 'done' });

    const board = groupTasksByStatus([todo1, todo2, inProgress, done]);

    expect(board.todo).toHaveLength(2);
    expect(board['in-progress']).toHaveLength(1);
    expect(board.done).toHaveLength(1);
  });

  it('sorts tasks within each bucket by priority', () => {
    const lowTodo = makeTask({ status: 'todo', priority: 'low' });
    const highTodo = makeTask({ status: 'todo', priority: 'high' });

    const board = groupTasksByStatus([lowTodo, highTodo]);

    expect(board.todo[0].priority).toBe('high');
    expect(board.todo[1].priority).toBe('low');
  });

  it('returns three empty arrays when given an empty input', () => {
    const board = groupTasksByStatus([]);

    expect(board.todo).toEqual([]);
    expect(board['in-progress']).toEqual([]);
    expect(board.done).toEqual([]);
  });

  it('puts all tasks in the relevant bucket and leaves others empty when all tasks share a status', () => {
    const t1 = makeTask({ status: 'in-progress' });
    const t2 = makeTask({ status: 'in-progress' });

    const board = groupTasksByStatus([t1, t2]);

    expect(board.todo).toEqual([]);
    expect(board['in-progress']).toHaveLength(2);
    expect(board.done).toEqual([]);
  });

  it('each task appears exactly once across all buckets (no duplication)', () => {
    const tasks = [
      makeTask({ status: 'todo' }),
      makeTask({ status: 'in-progress' }),
      makeTask({ status: 'done' }),
    ];

    const board = groupTasksByStatus(tasks);
    const allIds = [
      ...board.todo.map((t) => t.id),
      ...board['in-progress'].map((t) => t.id),
      ...board.done.map((t) => t.id),
    ];

    expect(allIds).toHaveLength(tasks.length);
    expect(new Set(allIds).size).toBe(tasks.length);
  });
});

// ---------------------------------------------------------------------------
// 3. getExpiredTaskIds
// ---------------------------------------------------------------------------

describe('getExpiredTaskIds', () => {
  const NOW = new Date('2024-03-10T12:00:00.000Z');

  it("returns an empty array for policy 'never' regardless of completion age", () => {
    const old = makeTask({
      status: 'done',
      completedAt: '2020-01-01T00:00:00.000Z',
    });

    const result = getExpiredTaskIds([old], 'never' as RetentionPolicy, NOW);

    expect(result).toEqual([]);
  });

  it("returns done tasks completed more than 5 days ago for policy '5d'", () => {
    const expired = makeTask({
      status: 'done',
      completedAt: '2024-03-04T11:59:59.000Z', // 5 days + 1 second ago
    });
    const fresh = makeTask({
      status: 'done',
      completedAt: '2024-03-08T12:00:00.000Z', // 2 days ago
    });

    const result = getExpiredTaskIds(
      [expired, fresh],
      '5d' as RetentionPolicy,
      NOW,
    );

    expect(result).toContain(expired.id);
    expect(result).not.toContain(fresh.id);
  });

  it("returns done tasks completed more than 7 days ago for policy '7d'", () => {
    const expired = makeTask({
      status: 'done',
      completedAt: '2024-03-02T11:59:59.000Z', // 7 days + 1 second ago
    });
    const borderline = makeTask({
      status: 'done',
      completedAt: '2024-03-03T12:00:00.000Z', // exactly 7 days ago
    });

    const result = getExpiredTaskIds(
      [expired, borderline],
      '7d' as RetentionPolicy,
      NOW,
    );

    expect(result).toContain(expired.id);
    expect(result).not.toContain(borderline.id);
  });

  it("returns done tasks completed more than 30 days ago for policy '30d'", () => {
    const expired = makeTask({
      status: 'done',
      completedAt: '2024-02-08T11:59:59.000Z', // 30 days + 1 second ago
    });
    const fresh = makeTask({
      status: 'done',
      completedAt: '2024-02-20T12:00:00.000Z', // 19 days ago
    });

    const result = getExpiredTaskIds(
      [expired, fresh],
      '30d' as RetentionPolicy,
      NOW,
    );

    expect(result).toContain(expired.id);
    expect(result).not.toContain(fresh.id);
  });

  it('does NOT return done tasks that are still within the retention window', () => {
    const recent = makeTask({
      status: 'done',
      completedAt: '2024-03-09T12:00:00.000Z', // 1 day ago
    });

    const result = getExpiredTaskIds([recent], '5d' as RetentionPolicy, NOW);

    expect(result).toEqual([]);
  });

  it('does NOT return non-done tasks regardless of how old they are', () => {
    const oldTodo = makeTask({
      status: 'todo',
      completedAt: '2020-01-01T00:00:00.000Z',
    });
    const oldInProgress = makeTask({
      status: 'in-progress',
      completedAt: '2020-01-01T00:00:00.000Z',
    });

    const result = getExpiredTaskIds(
      [oldTodo, oldInProgress],
      '5d' as RetentionPolicy,
      NOW,
    );

    expect(result).toEqual([]);
  });

  it('skips done tasks that have no completedAt (does not crash)', () => {
    const noCompletedAt = makeTask({ status: 'done' }); // completedAt omitted

    expect(() =>
      getExpiredTaskIds([noCompletedAt], '5d' as RetentionPolicy, NOW),
    ).not.toThrow();

    const result = getExpiredTaskIds(
      [noCompletedAt],
      '5d' as RetentionPolicy,
      NOW,
    );
    expect(result).not.toContain(noCompletedAt.id);
  });

  it('applies to archived done tasks in the same way as visible done tasks', () => {
    const archivedExpired = makeTask({
      status: 'done',
      isArchived: true,
      completedAt: '2024-02-01T00:00:00.000Z',
    });
    const visibleExpired = makeTask({
      status: 'done',
      isArchived: false,
      completedAt: '2024-02-01T00:00:00.000Z',
    });

    const result = getExpiredTaskIds(
      [archivedExpired, visibleExpired],
      '7d' as RetentionPolicy,
      NOW,
    );

    expect(result).toContain(archivedExpired.id);
    expect(result).toContain(visibleExpired.id);
  });

  it('uses the injected `now` parameter for deterministic results', () => {
    const customNow = new Date('2025-01-20T00:00:00.000Z');
    const task = makeTask({
      status: 'done',
      completedAt: '2025-01-12T00:00:00.000Z', // 8 days before customNow
    });

    const result = getExpiredTaskIds(
      [task],
      '7d' as RetentionPolicy,
      customNow,
    );

    expect(result).toContain(task.id);
  });
});

// ---------------------------------------------------------------------------
// 4. filterVisibleTasks
// ---------------------------------------------------------------------------

describe('filterVisibleTasks', () => {
  it('excludes tasks where status is done AND isArchived is true when showArchived is false', () => {
    const archivedDone = makeTask({ status: 'done', isArchived: true });
    const visibleDone = makeTask({ status: 'done', isArchived: false });

    const result = filterVisibleTasks([archivedDone, visibleDone], false);

    expect(result.map((t) => t.id)).not.toContain(archivedDone.id);
    expect(result.map((t) => t.id)).toContain(visibleDone.id);
  });

  it('keeps non-done tasks even if isArchived is true when showArchived is false', () => {
    const archivedTodo = makeTask({ status: 'todo', isArchived: true });
    const archivedInProgress = makeTask({
      status: 'in-progress',
      isArchived: true,
    });

    const result = filterVisibleTasks(
      [archivedTodo, archivedInProgress],
      false,
    );

    expect(result.map((t) => t.id)).toContain(archivedTodo.id);
    expect(result.map((t) => t.id)).toContain(archivedInProgress.id);
  });

  it('keeps done tasks that are NOT archived when showArchived is false', () => {
    const visibleDone = makeTask({ status: 'done', isArchived: false });

    const result = filterVisibleTasks([visibleDone], false);

    expect(result.map((t) => t.id)).toContain(visibleDone.id);
  });

  it('returns ALL tasks (archived and not) when showArchived is true', () => {
    const archivedDone = makeTask({ status: 'done', isArchived: true });
    const visibleTodo = makeTask({ status: 'todo' });

    const result = filterVisibleTasks([archivedDone, visibleTodo], true);

    expect(result).toHaveLength(2);
  });

  it('returns an empty array for empty input', () => {
    expect(filterVisibleTasks([], false)).toEqual([]);
    expect(filterVisibleTasks([], true)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 5. isDueDateOverdue
// ---------------------------------------------------------------------------

describe('isDueDateOverdue', () => {
  const TODAY = '2024-06-15';

  it('returns false when dueDate is undefined', () => {
    expect(isDueDateOverdue(undefined, 'todo', TODAY)).toBe(false);
  });

  it('returns true when dueDate is in the past and status is todo', () => {
    expect(isDueDateOverdue('2024-06-10', 'todo', TODAY)).toBe(true);
  });

  it('returns true when dueDate is in the past and status is in-progress', () => {
    expect(isDueDateOverdue('2024-06-10', 'in-progress', TODAY)).toBe(true);
  });

  it('returns false when dueDate is in the past but status is done (done tasks are never overdue)', () => {
    expect(isDueDateOverdue('2024-01-01', 'done', TODAY)).toBe(false);
  });

  it('returns false when dueDate equals today (today is NOT overdue)', () => {
    expect(isDueDateOverdue('2024-06-15', 'todo', TODAY)).toBe(false);
  });

  it('returns false when dueDate is in the future', () => {
    expect(isDueDateOverdue('2024-12-31', 'todo', TODAY)).toBe(false);
  });

  it('uses the injected `today` parameter for deterministic results', () => {
    const customToday = '2025-03-01';
    expect(isDueDateOverdue('2025-02-15', 'todo', customToday)).toBe(true);
    expect(isDueDateOverdue('2025-03-15', 'in-progress', customToday)).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// 6. getDueDateDaysRemaining
// ---------------------------------------------------------------------------

describe('getDueDateDaysRemaining', () => {
  it('returns positive number when due date is in the future', () => {
    expect(getDueDateDaysRemaining('2026-05-10', '2026-05-05')).toBe(5);
  });

  it('returns 0 when due date is today', () => {
    expect(getDueDateDaysRemaining('2026-05-05', '2026-05-05')).toBe(0);
  });

  it('returns negative number when due date is in the past', () => {
    expect(getDueDateDaysRemaining('2026-05-01', '2026-05-05')).toBe(-4);
  });

  it('returns 1 for tomorrow', () => {
    expect(getDueDateDaysRemaining('2026-05-06', '2026-05-05')).toBe(1);
  });

  it('returns -1 for yesterday', () => {
    expect(getDueDateDaysRemaining('2026-05-04', '2026-05-05')).toBe(-1);
  });

  it('handles month boundary correctly', () => {
    expect(getDueDateDaysRemaining('2026-06-01', '2026-05-30')).toBe(2);
  });

  it('handles year boundary correctly', () => {
    expect(getDueDateDaysRemaining('2027-01-01', '2026-12-30')).toBe(2);
  });

  it('handles leap year correctly (Feb has 29 days in 2028)', () => {
    expect(getDueDateDaysRemaining('2028-03-01', '2028-02-28')).toBe(2);
  });

  it('handles large differences', () => {
    expect(getDueDateDaysRemaining('2026-12-31', '2026-01-01')).toBe(364);
  });
});
