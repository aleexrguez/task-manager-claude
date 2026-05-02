import type {
  Task,
  TaskStatus,
  CreateTaskInput,
  RetentionPolicy,
  ReorderUpdate,
} from '../types';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function createLocalTask(input: CreateTaskInput): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    createdAt: now,
    updatedAt: now,
    position: 0,
    isArchived: false,
  };
}

export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
}

export function filterTasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((task) => task.status === status);
}

export function getTaskStats(tasks: Task[]) {
  return {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const priorityDiff =
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    if (a.dueDate && b.dueDate) {
      const dueDiff = a.dueDate.localeCompare(b.dueDate);
      if (dueDiff !== 0) return dueDiff;
    } else if (a.dueDate && !b.dueDate) {
      return -1;
    } else if (!a.dueDate && b.dueDate) {
      return 1;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

export interface TaskBoard {
  todo: Task[];
  'in-progress': Task[];
  done: Task[];
}

export function groupTasksByStatus(tasks: Task[]): TaskBoard {
  return {
    todo: sortTasks(tasks.filter((t) => t.status === 'todo')),
    'in-progress': sortTasks(tasks.filter((t) => t.status === 'in-progress')),
    done: sortTasks(tasks.filter((t) => t.status === 'done')),
  };
}

export function groupTasksByPosition(tasks: Task[]): TaskBoard {
  const byPosition = (a: Task, b: Task): number =>
    a.position - b.position || a.createdAt.localeCompare(b.createdAt);

  return {
    todo: tasks.filter((t) => t.status === 'todo').sort(byPosition),
    'in-progress': tasks
      .filter((t) => t.status === 'in-progress')
      .sort(byPosition),
    done: tasks.filter((t) => t.status === 'done').sort(byPosition),
  };
}

const RETENTION_DAYS: Record<RetentionPolicy, number | null> = {
  '5d': 5,
  '7d': 7,
  '30d': 30,
  never: null,
};

export function getExpiredTaskIds(
  tasks: Task[],
  policy: RetentionPolicy,
  now: Date = new Date(),
): string[] {
  const days = RETENTION_DAYS[policy];
  if (days === null) return [];

  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return tasks
    .filter(
      (t) =>
        t.status === 'done' &&
        t.completedAt !== undefined &&
        new Date(t.completedAt) < cutoff,
    )
    .map((t) => t.id);
}

export function buildDuplicateInput(task: Task): CreateTaskInput {
  return {
    title: `${task.title} (copy)`,
    description: task.description,
    status: task.status === 'done' ? 'todo' : task.status,
    priority: task.priority,
    dueDate: task.dueDate,
  };
}

export function filterVisibleTasks(
  tasks: Task[],
  showArchived: boolean,
): Task[] {
  if (showArchived) return tasks;
  return tasks.filter((t) => !(t.status === 'done' && t.isArchived === true));
}

export function isDueDateOverdue(
  dueDate: string | undefined,
  status: TaskStatus,
  today: string = new Date().toISOString().split('T')[0],
): boolean {
  if (dueDate === undefined) return false;
  if (status === 'done') return false;
  return dueDate < today;
}

function parseDateComponents(dateStr: string): [number, number, number] {
  const [y, m, d] = dateStr.split('-').map(Number);
  return [y, m, d];
}

/**
 * Computes the number of days between today and the due date.
 * Positive = future, 0 = today, negative = overdue.
 * Uses date-only arithmetic (YYYY-MM-DD) to avoid timezone issues.
 */
export function extractReorderUpdates(
  board: TaskBoard,
  currentTasks: Task[],
): ReorderUpdate[] {
  const byId = new Map(currentTasks.map((t) => [t.id, t]));
  const updates: ReorderUpdate[] = [];

  for (const status of ['todo', 'in-progress', 'done'] as const) {
    board[status].forEach((task, index) => {
      const original = byId.get(task.id);
      const positionChanged = !original || original.position !== index;
      const statusChanged = !original || original.status !== status;

      if (positionChanged || statusChanged) {
        const update: ReorderUpdate = { id: task.id, position: index };
        if (statusChanged) {
          update.status = status;
        }
        updates.push(update);
      }
    });
  }

  return updates;
}

export function getDueDateDaysRemaining(
  dueDate: string,
  today: string = new Date().toLocaleDateString('en-CA'),
): number {
  const [dy, dm, dd] = parseDateComponents(dueDate);
  const [ty, tm, td] = parseDateComponents(today);
  const dueMsUTC = Date.UTC(dy, dm - 1, dd);
  const todayMsUTC = Date.UTC(ty, tm - 1, td);
  return Math.round((dueMsUTC - todayMsUTC) / 86400000);
}
