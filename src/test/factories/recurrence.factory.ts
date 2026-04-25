import type {
  RecurrenceTemplate,
  CreateRecurrenceInput,
} from '@/features/recurrences/types/recurrence.types';

const TEMPLATE_DEFAULTS: RecurrenceTemplate = {
  id: 'recurrence-factory-001',
  title: 'Factory Recurrence',
  priority: 'medium',
  frequency: 'daily',
  leadTimeDays: 0,
  isActive: true,
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-10T10:00:00.000Z',
};

export function createMockRecurrenceTemplate(
  overrides: Partial<RecurrenceTemplate> = {},
): RecurrenceTemplate {
  return { ...TEMPLATE_DEFAULTS, ...overrides };
}

export function createDailyInput(
  overrides: Partial<
    Extract<CreateRecurrenceInput, { frequency: 'daily' }>
  > = {},
): Extract<CreateRecurrenceInput, { frequency: 'daily' }> {
  return {
    frequency: 'daily',
    title: 'Daily Task',
    priority: 'medium',
    ...overrides,
  };
}

export function createWeeklyInput(
  overrides: Partial<
    Extract<CreateRecurrenceInput, { frequency: 'weekly' }>
  > = {},
): Extract<CreateRecurrenceInput, { frequency: 'weekly' }> {
  return {
    frequency: 'weekly',
    title: 'Weekly Task',
    priority: 'medium',
    weeklyDays: [1],
    ...overrides,
  };
}

export function createMonthlyInput(
  overrides: Partial<
    Extract<CreateRecurrenceInput, { frequency: 'monthly' }>
  > = {},
): Extract<CreateRecurrenceInput, { frequency: 'monthly' }> {
  return {
    frequency: 'monthly',
    title: 'Monthly Task',
    priority: 'medium',
    monthlyDay: 1,
    leadTimeDays: 0,
    ...overrides,
  };
}
