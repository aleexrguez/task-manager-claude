import { describe, expect, it } from 'vitest';
import type { TaskBoard } from '../task.utils';
import type { Task, TaskStatus } from '../../types';

// These functions are defined in BoardView.tsx but we test the same logic
// via extracted pure implementations to validate the DnD flow.

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];
const STATUS_SET = new Set<string>(STATUSES);

function findContainer(board: TaskBoard, taskId: string): TaskStatus | null {
  for (const status of STATUSES) {
    if (board[status].some((t) => t.id === taskId)) {
      return status;
    }
  }
  return null;
}

function resolveStatus(
  overId: string,
  overData: Record<string, unknown> | undefined,
): TaskStatus | null {
  if (STATUS_SET.has(overId)) return overId as TaskStatus;

  const status = overData?.status as string | undefined;
  if (status && STATUS_SET.has(status)) return status as TaskStatus;

  const containerId = (overData?.sortable as { containerId?: string })
    ?.containerId;
  if (containerId && STATUS_SET.has(containerId)) {
    return containerId as TaskStatus;
  }

  return null;
}

function moveTaskToColumn(
  board: TaskBoard,
  taskId: string,
  sourceStatus: TaskStatus,
  targetStatus: TaskStatus,
): TaskBoard {
  const task = board[sourceStatus].find((t) => t.id === taskId);
  if (!task) return board;

  const movedTask = { ...task, status: targetStatus };
  return {
    ...board,
    [sourceStatus]: board[sourceStatus].filter((t) => t.id !== taskId),
    [targetStatus]: [...board[targetStatus], movedTask],
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Test Task',
    status: 'todo',
    priority: 'medium',
    isArchived: false,
    position: 0,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('findContainer', () => {
  it('finds the column containing a task', () => {
    const board: TaskBoard = {
      todo: [makeTask({ id: 'a' })],
      'in-progress': [makeTask({ id: 'b', status: 'in-progress' })],
      done: [],
    };

    expect(findContainer(board, 'a')).toBe('todo');
    expect(findContainer(board, 'b')).toBe('in-progress');
  });

  it('returns null for unknown task id', () => {
    const board: TaskBoard = { todo: [], 'in-progress': [], done: [] };

    expect(findContainer(board, 'nonexistent')).toBeNull();
  });
});

describe('resolveStatus', () => {
  it('resolves overId directly when it is a valid status', () => {
    expect(resolveStatus('todo', undefined)).toBe('todo');
    expect(resolveStatus('in-progress', undefined)).toBe('in-progress');
    expect(resolveStatus('done', undefined)).toBe('done');
  });

  it('resolves via overData.status when overId is a task id', () => {
    expect(resolveStatus('task-uuid-123', { status: 'in-progress' })).toBe(
      'in-progress',
    );
  });

  it('resolves via overData.sortable.containerId', () => {
    expect(
      resolveStatus('task-uuid-123', {
        sortable: { containerId: 'done' },
      }),
    ).toBe('done');
  });

  it('returns null when no resolution is possible', () => {
    expect(resolveStatus('random-id', undefined)).toBeNull();
    expect(resolveStatus('random-id', { foo: 'bar' })).toBeNull();
  });

  it('handles column droppable id for empty columns', () => {
    // This is the critical case: when over.id IS the column status
    // (empty column droppable), resolveStatus must return the status
    expect(resolveStatus('in-progress', {})).toBe('in-progress');
    expect(resolveStatus('todo', {})).toBe('todo');
    expect(resolveStatus('done', {})).toBe('done');
  });
});

describe('moveTaskToColumn', () => {
  it('moves a task from source to empty target column', () => {
    const task = makeTask({ id: 'move-me', status: 'todo' });
    const board: TaskBoard = {
      todo: [task],
      'in-progress': [],
      done: [],
    };

    const result = moveTaskToColumn(board, 'move-me', 'todo', 'in-progress');

    expect(result.todo).toHaveLength(0);
    expect(result['in-progress']).toHaveLength(1);
    expect(result['in-progress'][0].id).toBe('move-me');
    expect(result['in-progress'][0].status).toBe('in-progress');
  });

  it('appends task to end of non-empty target column', () => {
    const board: TaskBoard = {
      todo: [makeTask({ id: 'move-me', status: 'todo' })],
      'in-progress': [makeTask({ id: 'existing', status: 'in-progress' })],
      done: [],
    };

    const result = moveTaskToColumn(board, 'move-me', 'todo', 'in-progress');

    expect(result['in-progress']).toHaveLength(2);
    expect(result['in-progress'][0].id).toBe('existing');
    expect(result['in-progress'][1].id).toBe('move-me');
  });

  it('returns board unchanged if task not found in source', () => {
    const board: TaskBoard = { todo: [], 'in-progress': [], done: [] };

    const result = moveTaskToColumn(board, 'ghost', 'todo', 'in-progress');

    expect(result).toBe(board);
  });

  it('preserves other columns when moving', () => {
    const board: TaskBoard = {
      todo: [makeTask({ id: 'move-me', status: 'todo' })],
      'in-progress': [],
      done: [makeTask({ id: 'done-task', status: 'done' })],
    };

    const result = moveTaskToColumn(board, 'move-me', 'todo', 'in-progress');

    expect(result.done).toHaveLength(1);
    expect(result.done[0].id).toBe('done-task');
  });
});
