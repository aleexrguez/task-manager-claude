import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CreateRecurrenceInput } from '../types/recurrence.types';
import type { RecurrenceFrequency } from '../types/recurrence.types';
import type { TaskPriority } from '@/features/task-manager/types/task.types';
import { WeeklyDaysPicker } from './WeeklyDaysPicker';

interface RecurrenceFormProps {
  onSubmit: (data: CreateRecurrenceInput) => void;
  initialValues?: Partial<CreateRecurrenceInput>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

interface FormState {
  title: string;
  description: string;
  priority: TaskPriority;
  frequency: RecurrenceFrequency;
  weeklyDays: number[];
  monthlyDay: string;
  leadTimeDays: string;
}

function buildInitialState(
  initial?: Partial<CreateRecurrenceInput>,
): FormState {
  return {
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    priority: initial?.priority ?? 'medium',
    frequency: initial?.frequency ?? 'daily',
    weeklyDays:
      initial?.frequency === 'weekly' && 'weeklyDays' in (initial ?? {})
        ? ((initial as { weeklyDays?: number[] }).weeklyDays ?? [])
        : [],
    monthlyDay:
      initial?.frequency === 'monthly' && 'monthlyDay' in (initial ?? {})
        ? String((initial as { monthlyDay?: number }).monthlyDay ?? 1)
        : '1',
    leadTimeDays:
      initial?.frequency === 'monthly' && 'leadTimeDays' in (initial ?? {})
        ? String((initial as { leadTimeDays?: number }).leadTimeDays ?? 0)
        : '0',
  };
}

const inputClass =
  'rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

export function RecurrenceForm({
  onSubmit,
  initialValues,
  isSubmitting = false,
  submitLabel = 'Submit',
}: RecurrenceFormProps) {
  const [fields, setFields] = useState<FormState>(() =>
    buildInitialState(initialValues),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ): void {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleWeeklyDaysChange(days: number[]): void {
    setFields((prev) => ({ ...prev, weeklyDays: days }));
    setErrors((prev) => ({ ...prev, weeklyDays: '' }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!fields.title.trim()) {
      next.title = 'Title is required';
    }

    if (fields.frequency === 'weekly' && fields.weeklyDays.length === 0) {
      next.weeklyDays = 'Select at least one day';
    }

    if (
      fields.frequency === 'monthly' &&
      (isNaN(Number(fields.monthlyDay)) ||
        Number(fields.monthlyDay) < 1 ||
        Number(fields.monthlyDay) > 31)
    ) {
      next.monthlyDay = 'Day must be between 1 and 31';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!validate()) return;

    let payload: CreateRecurrenceInput;

    if (fields.frequency === 'daily') {
      payload = {
        frequency: 'daily',
        title: fields.title,
        priority: fields.priority,
        ...(fields.description ? { description: fields.description } : {}),
      };
    } else if (fields.frequency === 'weekly') {
      payload = {
        frequency: 'weekly',
        title: fields.title,
        priority: fields.priority,
        weeklyDays: fields.weeklyDays,
        ...(fields.description ? { description: fields.description } : {}),
      };
    } else {
      payload = {
        frequency: 'monthly',
        title: fields.title,
        priority: fields.priority,
        monthlyDay: Number(fields.monthlyDay),
        leadTimeDays: Number(fields.leadTimeDays),
        ...(fields.description ? { description: fields.description } : {}),
      };
    }

    onSubmit(payload);
  }

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
          value={fields.title}
          onChange={handleChange}
          className={inputClass}
          placeholder="Recurrence title"
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
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
          placeholder="Optional description"
        />
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
        <label htmlFor="frequency" className={labelClass}>
          Frequency
        </label>
        <select
          id="frequency"
          name="frequency"
          value={fields.frequency}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {fields.frequency === 'weekly' && (
        <div className="flex flex-col gap-1">
          <span className={labelClass}>Days of the week</span>
          <WeeklyDaysPicker
            selectedDays={fields.weeklyDays}
            onChange={handleWeeklyDaysChange}
          />
          {errors.weeklyDays && (
            <p className="text-xs text-red-500">{errors.weeklyDays}</p>
          )}
        </div>
      )}

      {fields.frequency === 'monthly' && (
        <div className="flex flex-col gap-1">
          <label htmlFor="monthlyDay" className={labelClass}>
            Monthly Day (1–31)
          </label>
          <input
            id="monthlyDay"
            name="monthlyDay"
            type="number"
            min={1}
            max={31}
            value={fields.monthlyDay}
            onChange={handleChange}
            className={inputClass}
          />
          {errors.monthlyDay && (
            <p className="text-xs text-red-500">{errors.monthlyDay}</p>
          )}
        </div>
      )}

      {fields.frequency === 'monthly' && (
        <div className="flex flex-col gap-1">
          <label htmlFor="leadTimeDays" className={labelClass}>
            Generate task X days before (0–14)
          </label>
          <input
            id="leadTimeDays"
            name="leadTimeDays"
            type="number"
            min={0}
            max={14}
            value={fields.leadTimeDays}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? `${submitLabel}...` : submitLabel}
      </button>
    </form>
  );
}
