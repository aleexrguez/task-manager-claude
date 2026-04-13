import { z } from 'zod';

export const taskStatusSchema = z.enum(['todo', 'in-progress', 'done']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.string().date().optional(),
  completedAt: z.iso.datetime().optional(),
  isArchived: z.boolean().default(false),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Task = z.infer<typeof taskSchema>;

export const createTaskInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema.default('medium'),
  dueDate: z.string().date().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = createTaskInputSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

export const retentionPolicySchema = z.enum(['5d', '7d', '30d', 'never']);
export type RetentionPolicy = z.infer<typeof retentionPolicySchema>;

export const viewModeSchema = z.enum(['list', 'board']);
export type ViewMode = z.infer<typeof viewModeSchema>;
