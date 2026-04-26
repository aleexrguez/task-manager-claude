import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { CreateTaskInput, TaskStatus, TaskPriority } from '../types';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => void;
  initialValues?: Partial<CreateTaskInput>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

interface FormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

function buildInitialState(initial?: Partial<CreateTaskInput>): FormState {
  return {
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'todo',
    priority: initial?.priority ?? 'medium',
    dueDate: initial?.dueDate ?? '',
  };
}

export function TaskForm({
  onSubmit,
  initialValues,
  isSubmitting = false,
  submitLabel = 'Submit',
}: TaskFormProps) {
  const [fields, setFields] = useState<FormState>(() =>
    buildInitialState(initialValues),
  );

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ): void {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const payload: CreateTaskInput = {
      title: fields.title,
      status: fields.status,
      priority: fields.priority,
    };
    if (fields.description) payload.description = fields.description;
    if (fields.dueDate) payload.dueDate = fields.dueDate;
    onSubmit(payload);
  }

  const inputClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';

  const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className={labelClass}>
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={fields.title}
          onChange={handleChange}
          className={inputClass}
          placeholder="Task title"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={fields.description}
          onChange={handleChange}
          className={inputClass}
          placeholder="Task description"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className={labelClass}>
          Status
        </label>
        <select
          id="status"
          name="status"
          value={fields.status}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="priority" className={labelClass}>
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          value={fields.priority}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="dueDate" className={labelClass}>
          Due Date
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          value={fields.dueDate}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        {isSubmitting ? `${submitLabel}...` : submitLabel}
      </button>
    </form>
  );
}
