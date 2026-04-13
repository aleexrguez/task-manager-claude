import { supabase } from '../../../shared/services/supabase';
import { requireAuthenticatedUser } from '../../../shared/services/auth.guard';
import type { Database } from '../../../shared/types/database.types';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';
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
  };
}

function toDbInsert(
  input: CreateTaskInput,
  userId: string,
): DbTaskInsert {
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

  if (error) throw new Error(`Task not found: ${id}`);
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
