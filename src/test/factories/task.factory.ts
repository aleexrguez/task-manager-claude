import type { Task } from '@/features/task-manager/types';

const TASK_DEFAULTS: Task = {
  id: 'task-factory-001',
  title: 'Factory Task',
  status: 'todo',
  priority: 'medium',
  isArchived: false,
  position: 0,
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-10T10:00:00.000Z',
};

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return { ...TASK_DEFAULTS, ...overrides };
}
