import { describe, it, expect } from 'vitest';
import type { Task } from '@/features/task-manager/types/task.types';
import type { RecurrenceTemplate } from '../../types/recurrence.types';
import {
  getISODayOfWeek,
  getLastDayOfMonth,
  clampMonthlyDay,
  formatDateKey,
  getOccurrenceDateForToday,
  getOccurrencesInWindow,
  getPendingGenerations,
  formatWeeklyDays,
  formatMonthlyDay,
  formatFrequencyLabel,
  isGeneratedTask,
  groupByFrequency,
} from '../recurrence.utils';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let _taskCounter = 0;
let _templateCounter = 0;

function makeTask(overrides: Partial<Task> = {}): Task {
  _taskCounter += 1;
  const base: Task = {
    id: `00000000-0000-0000-0000-${String(_taskCounter).padStart(12, '0')}`,
    title: `Task ${_taskCounter}`,
    status: 'todo',
    priority: 'medium',
    position: 0,
    isArchived: false,
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-01-10T10:00:00.000Z',
  };
  return { ...base, ...overrides };
}

function makeTemplate(
  overrides: Partial<RecurrenceTemplate> = {},
): RecurrenceTemplate {
  _templateCounter += 1;
  const base: RecurrenceTemplate = {
    id: `11111111-0000-0000-0000-${String(_templateCounter).padStart(12, '0')}`,
    title: `Template ${_templateCounter}`,
    priority: 'medium',
    frequency: 'daily',
    leadTimeDays: 0,
    isActive: true,
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-01-10T10:00:00.000Z',
  };
  return { ...base, ...overrides };
}

beforeEach(() => {
  _taskCounter = 0;
  _templateCounter = 0;
});

// ---------------------------------------------------------------------------
// 1. getISODayOfWeek
// ---------------------------------------------------------------------------

describe('getISODayOfWeek', () => {
  it('returns 1 for Monday', () => {
    // 2024-01-08 is a Monday
    expect(getISODayOfWeek(new Date('2024-01-08T12:00:00'))).toBe(1);
  });

  it('returns 2 for Tuesday', () => {
    // 2024-01-09 is a Tuesday
    expect(getISODayOfWeek(new Date('2024-01-09T12:00:00'))).toBe(2);
  });

  it('returns 3 for Wednesday', () => {
    // 2024-01-10 is a Wednesday
    expect(getISODayOfWeek(new Date('2024-01-10T12:00:00'))).toBe(3);
  });

  it('returns 4 for Thursday', () => {
    // 2024-01-11 is a Thursday
    expect(getISODayOfWeek(new Date('2024-01-11T12:00:00'))).toBe(4);
  });

  it('returns 5 for Friday', () => {
    // 2024-01-12 is a Friday
    expect(getISODayOfWeek(new Date('2024-01-12T12:00:00'))).toBe(5);
  });

  it('returns 6 for Saturday', () => {
    // 2024-01-13 is a Saturday
    expect(getISODayOfWeek(new Date('2024-01-13T12:00:00'))).toBe(6);
  });

  it('returns 7 for Sunday', () => {
    // 2024-01-14 is a Sunday
    expect(getISODayOfWeek(new Date('2024-01-14T12:00:00'))).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// 2. getLastDayOfMonth
// ---------------------------------------------------------------------------

describe('getLastDayOfMonth', () => {
  it('returns 31 for January', () => {
    expect(getLastDayOfMonth(2024, 1)).toBe(31);
  });

  it('returns 28 for February in a non-leap year', () => {
    expect(getLastDayOfMonth(2023, 2)).toBe(28);
  });

  it('returns 29 for February in a leap year', () => {
    expect(getLastDayOfMonth(2024, 2)).toBe(29);
  });

  it('returns 31 for March', () => {
    expect(getLastDayOfMonth(2024, 3)).toBe(31);
  });

  it('returns 30 for April', () => {
    expect(getLastDayOfMonth(2024, 4)).toBe(30);
  });

  it('returns 31 for December', () => {
    expect(getLastDayOfMonth(2024, 12)).toBe(31);
  });

  it('returns 30 for June', () => {
    expect(getLastDayOfMonth(2024, 6)).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// 3. clampMonthlyDay
// ---------------------------------------------------------------------------

describe('clampMonthlyDay', () => {
  it('clamps day 31 to 30 for April', () => {
    expect(clampMonthlyDay(31, 2024, 4)).toBe(30);
  });

  it('clamps day 29 to 28 for February in a non-leap year', () => {
    expect(clampMonthlyDay(29, 2023, 2)).toBe(28);
  });

  it('does NOT clamp day 29 for February in a leap year', () => {
    expect(clampMonthlyDay(29, 2024, 2)).toBe(29);
  });

  it('does NOT clamp day 15 for March (already within range)', () => {
    expect(clampMonthlyDay(15, 2024, 3)).toBe(15);
  });

  it('clamps day 31 to 30 for June', () => {
    expect(clampMonthlyDay(31, 2024, 6)).toBe(30);
  });

  it('does NOT clamp day 31 for January', () => {
    expect(clampMonthlyDay(31, 2024, 1)).toBe(31);
  });

  it('clamps day 30 to 28 for February in a non-leap year', () => {
    expect(clampMonthlyDay(30, 2023, 2)).toBe(28);
  });
});

// ---------------------------------------------------------------------------
// 4. formatDateKey
// ---------------------------------------------------------------------------

describe('formatDateKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDateKey(new Date(2024, 0, 8))).toBe('2024-01-08');
  });

  it('pads single-digit month and day with zeros', () => {
    expect(formatDateKey(new Date(2024, 8, 5))).toBe('2024-09-05');
  });

  it('formats December correctly', () => {
    expect(formatDateKey(new Date(2024, 11, 31))).toBe('2024-12-31');
  });

  it('formats February 29 in a leap year', () => {
    expect(formatDateKey(new Date(2024, 1, 29))).toBe('2024-02-29');
  });
});

// ---------------------------------------------------------------------------
// 5. getOccurrenceDateForToday
// ---------------------------------------------------------------------------

describe('getOccurrenceDateForToday', () => {
  describe('daily frequency', () => {
    it('always returns the dateKey for today', () => {
      const template = makeTemplate({ frequency: 'daily' });
      const monday = new Date(2024, 0, 8); // Monday
      expect(getOccurrenceDateForToday(template, monday)).toBe('2024-01-08');
    });

    it('returns dateKey on any day of the week', () => {
      const template = makeTemplate({ frequency: 'daily' });
      const sunday = new Date(2024, 0, 14); // Sunday
      expect(getOccurrenceDateForToday(template, sunday)).toBe('2024-01-14');
    });
  });

  describe('weekly frequency', () => {
    it('returns dateKey when today matches one of the weeklyDays (Mon in [1,3,5])', () => {
      const template = makeTemplate({
        frequency: 'weekly',
        weeklyDays: [1, 3, 5],
      });
      const monday = new Date(2024, 0, 8); // Monday
      expect(getOccurrenceDateForToday(template, monday)).toBe('2024-01-08');
    });

    it('returns null when today does NOT match weeklyDays (Tue not in [1,3,5])', () => {
      const template = makeTemplate({
        frequency: 'weekly',
        weeklyDays: [1, 3, 5],
      });
      const tuesday = new Date(2024, 0, 9); // Tuesday
      expect(getOccurrenceDateForToday(template, tuesday)).toBeNull();
    });

    it('returns dateKey when today is Sunday (day 7) and 7 is in weeklyDays', () => {
      const template = makeTemplate({
        frequency: 'weekly',
        weeklyDays: [7],
      });
      const sunday = new Date(2024, 0, 14); // Sunday
      expect(getOccurrenceDateForToday(template, sunday)).toBe('2024-01-14');
    });

    it('returns null when weeklyDays is undefined', () => {
      const template = makeTemplate({ frequency: 'weekly' });
      const monday = new Date(2024, 0, 8);
      expect(getOccurrenceDateForToday(template, monday)).toBeNull();
    });

    it('returns null when today is Saturday but weeklyDays is [1,3,5]', () => {
      const template = makeTemplate({
        frequency: 'weekly',
        weeklyDays: [1, 3, 5],
      });
      const saturday = new Date(2024, 0, 13); // Saturday
      expect(getOccurrenceDateForToday(template, saturday)).toBeNull();
    });
  });

  describe('monthly frequency', () => {
    it('returns dateKey when today is the 15th and monthlyDay is 15', () => {
      const template = makeTemplate({
        frequency: 'monthly',
        monthlyDay: 15,
      });
      const the15th = new Date(2024, 0, 15);
      expect(getOccurrenceDateForToday(template, the15th)).toBe('2024-01-15');
    });

    it('returns null when today is the 14th and monthlyDay is 15', () => {
      const template = makeTemplate({
        frequency: 'monthly',
        monthlyDay: 15,
      });
      const the14th = new Date(2024, 0, 14);
      expect(getOccurrenceDateForToday(template, the14th)).toBeNull();
    });

    it('clamps day 31 to 30 for April — generates on Apr 30', () => {
      const template = makeTemplate({
        frequency: 'monthly',
        monthlyDay: 31,
      });
      const apr30 = new Date(2024, 3, 30); // April 30
      expect(getOccurrenceDateForToday(template, apr30)).toBe('2024-04-30');
    });

    it('clamps day 31 to 30 for April — does NOT generate on Apr 31 (non-existent)', () => {
      const template = makeTemplate({
        frequency: 'monthly',
        monthlyDay: 31,
      });
      // April 31 doesn't exist — the clamp means apr30 is the match day
      const apr29 = new Date(2024, 3, 29); // April 29
      expect(getOccurrenceDateForToday(template, apr29)).toBeNull();
    });

    it('clamps day 29 to 28 for February in non-leap year — generates on Feb 28', () => {
      const template = makeTemplate({
        frequency: 'monthly',
        monthlyDay: 29,
      });
      const feb28NonLeap = new Date(2023, 1, 28); // Feb 28 2023 (non-leap)
      expect(getOccurrenceDateForToday(template, feb28NonLeap)).toBe(
        '2023-02-28',
      );
    });

    it('does NOT clamp day 29 for February in a leap year — generates on Feb 29', () => {
      const template = makeTemplate({
        frequency: 'monthly',
        monthlyDay: 29,
      });
      const feb29Leap = new Date(2024, 1, 29); // Feb 29 2024 (leap year)
      expect(getOccurrenceDateForToday(template, feb29Leap)).toBe('2024-02-29');
    });

    it('returns null when monthlyDay is undefined', () => {
      const template = makeTemplate({ frequency: 'monthly' });
      const the15th = new Date(2024, 0, 15);
      expect(getOccurrenceDateForToday(template, the15th)).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// 6. getPendingGenerations
// ---------------------------------------------------------------------------

describe('getPendingGenerations', () => {
  const TODAY = new Date(2024, 0, 8); // Monday, January 8 2024
  const TODAY_KEY = '2024-01-08';

  it('returns a pending generation for an active daily template with no existing task', () => {
    const template = makeTemplate({ frequency: 'daily' });
    const result = getPendingGenerations([template], [], TODAY);

    expect(result).toHaveLength(1);
    expect(result[0].templateId).toBe(template.id);
    expect(result[0].dateKey).toBe(TODAY_KEY);
    expect(result[0].title).toBe(template.title);
    expect(result[0].priority).toBe(template.priority);
  });

  it('skips template when a task already exists with matching templateId and dateKey', () => {
    const template = makeTemplate({ frequency: 'daily' });
    const existingTask = makeTask({
      recurrenceTemplateId: template.id,
      recurrenceDateKey: TODAY_KEY,
    });

    const result = getPendingGenerations([template], [existingTask], TODAY);

    expect(result).toHaveLength(0);
  });

  it('does NOT skip template when existing task has different dateKey', () => {
    const template = makeTemplate({ frequency: 'daily' });
    const existingTask = makeTask({
      recurrenceTemplateId: template.id,
      recurrenceDateKey: '2024-01-07', // yesterday
    });

    const result = getPendingGenerations([template], [existingTask], TODAY);

    expect(result).toHaveLength(1);
  });

  it('does NOT skip template when existing task has different templateId', () => {
    const template = makeTemplate({ frequency: 'daily' });
    const existingTask = makeTask({
      recurrenceTemplateId: '99999999-0000-0000-0000-000000000001',
      recurrenceDateKey: TODAY_KEY,
    });

    const result = getPendingGenerations([template], [existingTask], TODAY);

    expect(result).toHaveLength(1);
  });

  it('returns multiple pending for multiple active templates', () => {
    const template1 = makeTemplate({ frequency: 'daily' });
    const template2 = makeTemplate({ frequency: 'daily' });

    const result = getPendingGenerations([template1, template2], [], TODAY);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.templateId)).toContain(template1.id);
    expect(result.map((p) => p.templateId)).toContain(template2.id);
  });

  it('returns empty array for empty templates list', () => {
    const result = getPendingGenerations([], [], TODAY);
    expect(result).toEqual([]);
  });

  it('skips inactive templates', () => {
    const inactiveTemplate = makeTemplate({
      frequency: 'daily',
      isActive: false,
    });

    const result = getPendingGenerations([inactiveTemplate], [], TODAY);

    expect(result).toHaveLength(0);
  });

  it('skips weekly template when today is not in weeklyDays', () => {
    // TODAY is Monday (1). Template runs on Wed (3) and Fri (5).
    const template = makeTemplate({
      frequency: 'weekly',
      weeklyDays: [3, 5],
    });

    const result = getPendingGenerations([template], [], TODAY);

    expect(result).toHaveLength(0);
  });

  it('includes weekly template when today is in weeklyDays', () => {
    // TODAY is Monday (1). Template runs Mon (1) and Fri (5).
    const template = makeTemplate({
      frequency: 'weekly',
      weeklyDays: [1, 5],
    });

    const result = getPendingGenerations([template], [], TODAY);

    expect(result).toHaveLength(1);
  });

  it('includes pending description when template has description', () => {
    const template = makeTemplate({
      frequency: 'daily',
      description: 'Do the thing',
    });

    const result = getPendingGenerations([template], [], TODAY);

    expect(result[0].description).toBe('Do the thing');
  });

  it('omits description in pending when template has no description', () => {
    const template = makeTemplate({ frequency: 'daily' });

    const result = getPendingGenerations([template], [], TODAY);

    expect(result[0].description).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 7. formatWeeklyDays
// ---------------------------------------------------------------------------

describe('formatWeeklyDays', () => {
  it('formats [1] as "Mon"', () => {
    expect(formatWeeklyDays([1])).toBe('Mon');
  });

  it('formats [1, 3, 5] as "Mon, Wed, Fri"', () => {
    expect(formatWeeklyDays([1, 3, 5])).toBe('Mon, Wed, Fri');
  });

  it('formats [2, 4] as "Tue, Thu"', () => {
    expect(formatWeeklyDays([2, 4])).toBe('Tue, Thu');
  });

  it('formats [6, 7] as "Sat, Sun"', () => {
    expect(formatWeeklyDays([6, 7])).toBe('Sat, Sun');
  });

  it('formats all 7 days', () => {
    expect(formatWeeklyDays([1, 2, 3, 4, 5, 6, 7])).toBe(
      'Mon, Tue, Wed, Thu, Fri, Sat, Sun',
    );
  });

  it('formats days even if passed out of order', () => {
    // [5, 1, 3] — should preserve the given order (or sort, be consistent)
    // We sort by day number for consistent display
    expect(formatWeeklyDays([5, 1, 3])).toBe('Mon, Wed, Fri');
  });
});

// ---------------------------------------------------------------------------
// 8. formatMonthlyDay
// ---------------------------------------------------------------------------

describe('formatMonthlyDay', () => {
  it('formats 1 as "1st"', () => {
    expect(formatMonthlyDay(1)).toBe('1st');
  });

  it('formats 2 as "2nd"', () => {
    expect(formatMonthlyDay(2)).toBe('2nd');
  });

  it('formats 3 as "3rd"', () => {
    expect(formatMonthlyDay(3)).toBe('3rd');
  });

  it('formats 4 as "4th"', () => {
    expect(formatMonthlyDay(4)).toBe('4th');
  });

  it('formats 11 as "11th" (teen exception)', () => {
    expect(formatMonthlyDay(11)).toBe('11th');
  });

  it('formats 12 as "12th" (teen exception)', () => {
    expect(formatMonthlyDay(12)).toBe('12th');
  });

  it('formats 13 as "13th" (teen exception)', () => {
    expect(formatMonthlyDay(13)).toBe('13th');
  });

  it('formats 21 as "21st"', () => {
    expect(formatMonthlyDay(21)).toBe('21st');
  });

  it('formats 22 as "22nd"', () => {
    expect(formatMonthlyDay(22)).toBe('22nd');
  });

  it('formats 23 as "23rd"', () => {
    expect(formatMonthlyDay(23)).toBe('23rd');
  });

  it('formats 31 as "31st"', () => {
    expect(formatMonthlyDay(31)).toBe('31st');
  });

  it('formats 15 as "15th"', () => {
    expect(formatMonthlyDay(15)).toBe('15th');
  });
});

// ---------------------------------------------------------------------------
// 9. formatFrequencyLabel
// ---------------------------------------------------------------------------

describe('formatFrequencyLabel', () => {
  it('returns "Daily" for a daily template', () => {
    const template = makeTemplate({ frequency: 'daily' });
    expect(formatFrequencyLabel(template)).toBe('Daily');
  });

  it('returns "Weekly (Mon, Wed, Fri)" for a weekly template with [1,3,5]', () => {
    const template = makeTemplate({
      frequency: 'weekly',
      weeklyDays: [1, 3, 5],
    });
    expect(formatFrequencyLabel(template)).toBe('Weekly (Mon, Wed, Fri)');
  });

  it('returns "Weekly" for a weekly template without weeklyDays', () => {
    const template = makeTemplate({ frequency: 'weekly' });
    expect(formatFrequencyLabel(template)).toBe('Weekly');
  });

  it('returns "Monthly (15th)" for a monthly template with monthlyDay 15', () => {
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 15,
    });
    expect(formatFrequencyLabel(template)).toBe('Monthly (15th)');
  });

  it('returns "Monthly" for a monthly template without monthlyDay', () => {
    const template = makeTemplate({ frequency: 'monthly' });
    expect(formatFrequencyLabel(template)).toBe('Monthly');
  });

  it('returns "Monthly (1st)" for monthlyDay 1', () => {
    const template = makeTemplate({ frequency: 'monthly', monthlyDay: 1 });
    expect(formatFrequencyLabel(template)).toBe('Monthly (1st)');
  });
});

// ---------------------------------------------------------------------------
// 10. isGeneratedTask
// ---------------------------------------------------------------------------

describe('isGeneratedTask', () => {
  it('returns true when task has recurrenceDateKey set', () => {
    const task = makeTask({ recurrenceDateKey: '2024-01-08' });
    expect(isGeneratedTask(task)).toBe(true);
  });

  it('returns false when task has no recurrenceDateKey', () => {
    const task = makeTask();
    expect(isGeneratedTask(task)).toBe(false);
  });

  it('returns false when task recurrenceDateKey is undefined', () => {
    const task = makeTask({ recurrenceDateKey: undefined });
    expect(isGeneratedTask(task)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. getOccurrencesInWindow — monthly lead time
// ---------------------------------------------------------------------------

describe('getOccurrencesInWindow — monthly lead time', () => {
  it('returns occurrence dateKey when today is within lead window (5 days before Jan 1)', () => {
    // today = Dec 27 2026, occurrence = Jan 1 2027, leadTimeDays = 5
    // generationStart = Dec 27 → today >= start → include
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 1,
      leadTimeDays: 5,
    });
    const today = new Date(2026, 11, 27); // Dec 27 2026
    expect(getOccurrencesInWindow(template, today)).toEqual(['2027-01-01']);
  });

  it('returns occurrence dateKey when today is exactly at the lead window boundary', () => {
    // today = Dec 26 2026, generationStart = Jan 1 - 5 = Dec 27 → NOT in window
    // Actually: generationStart = Jan 1 minus 5 days = Dec 27 2026
    // Dec 26 is BEFORE Dec 27 → outside window → returns []
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 1,
      leadTimeDays: 5,
    });
    const today = new Date(2026, 11, 26); // Dec 26 2026
    expect(getOccurrencesInWindow(template, today)).toEqual([]);
  });

  it('returns occurrence dateKey when today equals generationStart (boundary inclusive)', () => {
    // today = Dec 27 2026 = generationStart (Jan 1 - 5 days) → in window
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 1,
      leadTimeDays: 5,
    });
    const today = new Date(2026, 11, 27); // Dec 27 2026
    expect(getOccurrencesInWindow(template, today)).toEqual(['2027-01-01']);
  });

  it('returns occurrence dateKey when today IS the due date', () => {
    // today = Jan 1 2027, occurrence = Jan 1 2027, leadTimeDays = 5
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 1,
      leadTimeDays: 5,
    });
    const today = new Date(2027, 0, 1); // Jan 1 2027
    expect(getOccurrencesInWindow(template, today)).toEqual(['2027-01-01']);
  });

  it('returns [] when today is outside the lead window (too early)', () => {
    // today = Dec 25 2026, generationStart = Dec 27 → outside window
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 1,
      leadTimeDays: 5,
    });
    const today = new Date(2026, 11, 25); // Dec 25 2026
    expect(getOccurrencesInWindow(template, today)).toEqual([]);
  });

  it('behaves like current logic for leadTimeDays = 0 (returns dateKey only on due date)', () => {
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 1,
      leadTimeDays: 0,
    });
    const dueDate = new Date(2027, 0, 1); // Jan 1 2027
    expect(getOccurrencesInWindow(template, dueDate)).toEqual(['2027-01-01']);
  });

  it('returns [] for leadTimeDays = 0 when today is not the due date', () => {
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 1,
      leadTimeDays: 0,
    });
    const dayBefore = new Date(2026, 11, 31); // Dec 31 2026
    expect(getOccurrencesInWindow(template, dayBefore)).toEqual([]);
  });

  it('handles clamping correctly — monthlyDay 31, leadTimeDays 5, Feb 28 non-leap', () => {
    // occurrence = Feb 28 2023 (31 clamped to 28), generationStart = Feb 23 2023
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 31,
      leadTimeDays: 5,
    });
    const today = new Date(2023, 1, 25); // Feb 25 2023 — within window
    expect(getOccurrencesInWindow(template, today)).toEqual(['2023-02-28']);
  });

  it('handles lead window crossing month boundary (day 3, leadTimeDays 5, today Nov 28)', () => {
    // occurrence = Dec 3 2026, generationStart = Nov 28 2026
    // today = Nov 28 → exactly at boundary → in window
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 3,
      leadTimeDays: 5,
    });
    const today = new Date(2026, 10, 28); // Nov 28 2026
    expect(getOccurrencesInWindow(template, today)).toEqual(['2026-12-03']);
  });

  it('daily with leadTimeDays = 0 returns [todayKey] (same as before)', () => {
    const template = makeTemplate({ frequency: 'daily', leadTimeDays: 0 });
    const today = new Date(2026, 0, 10); // Jan 10 2026
    expect(getOccurrencesInWindow(template, today)).toEqual(['2026-01-10']);
  });

  it('weekly with leadTimeDays = 0 returns [todayKey] when day matches', () => {
    const template = makeTemplate({
      frequency: 'weekly',
      weeklyDays: [1],
      leadTimeDays: 0,
    });
    const monday = new Date(2024, 0, 8); // Monday
    expect(getOccurrencesInWindow(template, monday)).toEqual(['2024-01-08']);
  });
});

// ---------------------------------------------------------------------------
// 12. getPendingGenerations — lead time dedup
// ---------------------------------------------------------------------------

describe('getPendingGenerations — monthly with lead time', () => {
  it('returns pending with correct dateKey (occurrence date, not generation date) for early gen', () => {
    // today = Nov 28 2026, occurrence = Dec 3, leadTimeDays = 5
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 3,
      leadTimeDays: 5,
    });
    const today = new Date(2026, 10, 28); // Nov 28

    const result = getPendingGenerations([template], [], today);

    expect(result).toHaveLength(1);
    expect(result[0].dateKey).toBe('2026-12-03');
  });

  it('skips template when task already exists for the occurrence dateKey', () => {
    const template = makeTemplate({
      frequency: 'monthly',
      monthlyDay: 3,
      leadTimeDays: 5,
    });
    const today = new Date(2026, 10, 28); // Nov 28 — within window for Dec 3
    const existingTask = makeTask({
      recurrenceTemplateId: template.id,
      recurrenceDateKey: '2026-12-03', // task already generated for Dec 3
    });

    const result = getPendingGenerations([template], [existingTask], today);

    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 13. groupByFrequency
// ---------------------------------------------------------------------------

describe('groupByFrequency', () => {
  it('groups mixed templates into the correct frequency buckets', () => {
    const daily1 = makeTemplate({ frequency: 'daily' });
    const weekly1 = makeTemplate({ frequency: 'weekly', weeklyDays: [1] });
    const monthly1 = makeTemplate({ frequency: 'monthly', monthlyDay: 15 });

    const result = groupByFrequency([daily1, weekly1, monthly1]);

    expect(result.daily).toEqual([daily1]);
    expect(result.weekly).toEqual([weekly1]);
    expect(result.monthly).toEqual([monthly1]);
  });

  it('returns empty arrays for frequency groups with no templates', () => {
    const daily1 = makeTemplate({ frequency: 'daily' });

    const result = groupByFrequency([daily1]);

    expect(result.weekly).toEqual([]);
    expect(result.monthly).toEqual([]);
  });

  it('returns all empty arrays for an empty input array', () => {
    const result = groupByFrequency([]);

    expect(result.daily).toEqual([]);
    expect(result.weekly).toEqual([]);
    expect(result.monthly).toEqual([]);
  });

  it('preserves insertion order within each group', () => {
    const daily1 = makeTemplate({ frequency: 'daily', title: 'First' });
    const daily2 = makeTemplate({ frequency: 'daily', title: 'Second' });
    const daily3 = makeTemplate({ frequency: 'daily', title: 'Third' });

    const result = groupByFrequency([daily1, daily2, daily3]);

    expect(result.daily[0].title).toBe('First');
    expect(result.daily[1].title).toBe('Second');
    expect(result.daily[2].title).toBe('Third');
  });

  it('places multiple templates of the same frequency in the same bucket', () => {
    const weekly1 = makeTemplate({ frequency: 'weekly', weeklyDays: [1] });
    const weekly2 = makeTemplate({ frequency: 'weekly', weeklyDays: [3] });
    const weekly3 = makeTemplate({ frequency: 'weekly', weeklyDays: [5] });

    const result = groupByFrequency([weekly1, weekly2, weekly3]);

    expect(result.weekly).toHaveLength(3);
    expect(result.daily).toHaveLength(0);
    expect(result.monthly).toHaveLength(0);
  });
});
