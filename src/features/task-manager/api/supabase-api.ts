import { supabase } from '../../../shared/services/supabase';
import { requireAuthenticatedUser } from '../../../shared/services/auth.guard';
import type { Database } from '../../../shared/types/database.types';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderUpdate,
} from '../types';
import type { TaskListResponse } from './task.dto';

// ---------------------------------------------------------------------------
// DB Row ↔ Domain mappers (database.types.ts stays confined to this file)
// ---------------------------------------------------------------------------

type DbTaskRow = Database['public']['Tables']['tasks']['Row'];
type DbTaskInsert = Database['public']['Tables']['tasks']['Insert'];

function fromDbRow(row: DbTaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    dueDate: row.due_date ?? undefined,
    completedAt: row.completed_at ?? undefined,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recurrenceTemplateId: row.recurrence_template_id ?? undefined,
    recurrenceDateKey: row.recurrence_date_key ?? undefined,
    position: row.position,
  };
}

function toDbInsert(input: CreateTaskInput, userId: string): DbTaskInsert {
  return {
    user_id: userId,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    due_date: input.dueDate ?? null,
  };
}

// ---------------------------------------------------------------------------
// API functions — same 8 signatures as mock-api.ts
// ---------------------------------------------------------------------------

export async function fetchTasks(): Promise<TaskListResponse> {
  await requireAuthenticatedUser();

  const { data, error, count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact' });

  if (error) throw new Error(error.message);

  const tasks = (data ?? []).map(fromDbRow);
  return { tasks, total: count ?? tasks.length };
}

export async function fetchTaskById(id: string): Promise<Task> {
  await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Task not found: ${id}`);
  return fromDbRow(data);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const userId = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from('tasks')
    .insert(toDbInsert(input, userId))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return fromDbRow(data);
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  await requireAuthenticatedUser();

  // Fetch current task to apply domain transition logic
  const { data: existing, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existing) throw new Error(`Task not found: ${id}`);

  // Domain logic: completedAt / isArchived transitions
  const updates: Database['public']['Tables']['tasks']['Update'] = {};

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined)
    updates.description = input.description ?? null;
  if (input.status !== undefined) updates.status = input.status;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate ?? null;

  // Transition: * → done → set completedAt
  if (input.status === 'done' && existing.status !== 'done') {
    updates.completed_at = new Date().toISOString();
  }

  // Transition: done → * → clear completedAt + reset isArchived
  if (input.status && input.status !== 'done' && existing.status === 'done') {
    updates.completed_at = null;
    updates.is_archived = false;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return fromDbRow(data);
}

export async function deleteTask(id: string): Promise<void> {
  await requireAuthenticatedUser();

  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function archiveTask(id: string): Promise<Task> {
  await requireAuthenticatedUser();

  // Verify task is done before archiving
  const { data: existing, error: fetchError } = await supabase
    .from('tasks')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError || !existing) throw new Error(`Task not found: ${id}`);
  if (existing.status !== 'done')
    throw new Error('Only done tasks can be archived');

  const { data, error } = await supabase
    .from('tasks')
    .update({ is_archived: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return fromDbRow(data);
}

export async function unarchiveTask(id: string): Promise<Task> {
  await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from('tasks')
    .update({ is_archived: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Task not found: ${id}`);
  return fromDbRow(data);
}

export async function purgeTasks(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) return;

  await requireAuthenticatedUser();

  const { error } = await supabase.from('tasks').delete().in('id', taskIds);

  if (error) throw new Error(error.message);
}

export async function reorderTasks(updates: ReorderUpdate[]): Promise<void> {
  if (updates.length === 0) return;
  await requireAuthenticatedUser();

  // Fetch current tasks to apply domain transition logic for status changes
  const ids = updates.filter((u) => u.status !== undefined).map((u) => u.id);
  let existingTasks: Map<string, DbTaskRow> = new Map();

  if (ids.length > 0) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('id', ids);
    if (error) throw new Error(error.message);
    existingTasks = new Map((data ?? []).map((row) => [row.id, row]));
  }

  const promises = updates.map((update) => {
    const fields: Database['public']['Tables']['tasks']['Update'] = {
      position: update.position,
    };

    if (update.status !== undefined) {
      fields.status = update.status;
      const existing = existingTasks.get(update.id);
      if (existing) {
        if (update.status === 'done' && existing.status !== 'done') {
          fields.completed_at = new Date().toISOString();
        }
        if (update.status !== 'done' && existing.status === 'done') {
          fields.completed_at = null;
          fields.is_archived = false;
        }
      }
    }

    return supabase.from('tasks').update(fields).eq('id', update.id);
  });

  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}
