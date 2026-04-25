import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RecurrenceTemplate } from '../../types/recurrence.types';
import { RecurrenceGroupedLayout } from '../RecurrenceGroupedLayout';

function makeTemplate(
  overrides: Partial<RecurrenceTemplate> = {},
): RecurrenceTemplate {
  return {
    id: crypto.randomUUID(),
    title: 'Test template',
    priority: 'medium',
    frequency: 'daily',
    leadTimeDays: 0,
    isActive: true,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    ...overrides,
  };
}

const emptyGroups = { daily: [], weekly: [], monthly: [] };

describe('RecurrenceGroupedLayout — section headings', () => {
  it('renders a "Daily" heading when there are daily templates', () => {
    const groups = {
      ...emptyGroups,
      daily: [makeTemplate({ frequency: 'daily', title: 'Morning run' })],
    };
    render(<RecurrenceGroupedLayout groups={groups} />);

    expect(
      screen.getByRole('heading', { name: /daily/i, level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders a "Weekly" heading when there are weekly templates', () => {
    const groups = {
      ...emptyGroups,
      weekly: [
        makeTemplate({
          frequency: 'weekly',
          weeklyDays: [1],
          title: 'Weekly review',
        }),
      ],
    };
    render(<RecurrenceGroupedLayout groups={groups} />);

    expect(
      screen.getByRole('heading', { name: /weekly/i, level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders a "Monthly" heading when there are monthly templates', () => {
    const groups = {
      ...emptyGroups,
      monthly: [
        makeTemplate({
          frequency: 'monthly',
          monthlyDay: 15,
          title: 'Monthly billing',
        }),
      ],
    };
    render(<RecurrenceGroupedLayout groups={groups} />);

    expect(
      screen.getByRole('heading', { name: /monthly/i, level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders all three headings when all groups are non-empty', () => {
    const groups = {
      daily: [makeTemplate({ frequency: 'daily' })],
      weekly: [makeTemplate({ frequency: 'weekly', weeklyDays: [1] })],
      monthly: [makeTemplate({ frequency: 'monthly', monthlyDay: 5 })],
    };
    render(<RecurrenceGroupedLayout groups={groups} />);

    expect(
      screen.getByRole('heading', { name: /daily/i, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /weekly/i, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /monthly/i, level: 2 }),
    ).toBeInTheDocument();
  });
});

describe('RecurrenceGroupedLayout — hidden empty groups', () => {
  it('hides the "Daily" section when daily group is empty', () => {
    const groups = {
      daily: [],
      weekly: [makeTemplate({ frequency: 'weekly', weeklyDays: [1] })],
      monthly: [],
    };
    render(<RecurrenceGroupedLayout groups={groups} />);

    expect(
      screen.queryByRole('heading', { name: /daily/i }),
    ).not.toBeInTheDocument();
  });

  it('hides the "Weekly" section when weekly group is empty', () => {
    const groups = {
      daily: [makeTemplate({ frequency: 'daily' })],
      weekly: [],
      monthly: [],
    };
    render(<RecurrenceGroupedLayout groups={groups} />);

    expect(
      screen.queryByRole('heading', { name: /weekly/i }),
    ).not.toBeInTheDocument();
  });

  it('hides the "Monthly" section when monthly group is empty', () => {
    const groups = {
      daily: [],
      weekly: [makeTemplate({ frequency: 'weekly', weeklyDays: [3] })],
      monthly: [],
    };
    render(<RecurrenceGroupedLayout groups={groups} />);

    expect(
      screen.queryByRole('heading', { name: /monthly/i }),
    ).not.toBeInTheDocument();
  });
});

describe('RecurrenceGroupedLayout — empty state', () => {
  it('shows a single empty state message when all groups are empty', () => {
    render(<RecurrenceGroupedLayout groups={emptyGroups} />);

    expect(screen.getByText(/no recurrences/i)).toBeInTheDocument();
  });

  it('does not render any section headings when all groups are empty', () => {
    render(<RecurrenceGroupedLayout groups={emptyGroups} />);

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });
});

describe('RecurrenceGroupedLayout — template content', () => {
  it('renders template titles within the correct section', () => {
    const groups = {
      daily: [makeTemplate({ frequency: 'daily', title: 'Morning standup' })],
      weekly: [],
      monthly: [],
    };
    render(<RecurrenceGroupedLayout groups={groups} />);

    expect(screen.getByText('Morning standup')).toBeInTheDocument();
  });

  it('renders templates from multiple groups', () => {
    const groups = {
      daily: [makeTemplate({ frequency: 'daily', title: 'Daily task' })],
      weekly: [
        makeTemplate({
          frequency: 'weekly',
          weeklyDays: [1],
          title: 'Weekly task',
        }),
      ],
      monthly: [],
    };
    render(<RecurrenceGroupedLayout groups={groups} />);

    expect(screen.getByText('Daily task')).toBeInTheDocument();
    expect(screen.getByText('Weekly task')).toBeInTheDocument();
  });
});

describe('RecurrenceGroupedLayout — callback pass-through', () => {
  it('calls onEdit with the template id when edit is triggered inside a group', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const groups = {
      ...emptyGroups,
      daily: [
        makeTemplate({ id: 'tmpl-001', frequency: 'daily', title: 'Run' }),
      ],
    };
    render(<RecurrenceGroupedLayout groups={groups} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith('tmpl-001');
  });

  it('calls onDelete with the template id when delete is triggered inside a group', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const groups = {
      ...emptyGroups,
      monthly: [
        makeTemplate({
          id: 'tmpl-002',
          frequency: 'monthly',
          monthlyDay: 10,
          title: 'Pay bills',
        }),
      ],
    };
    render(<RecurrenceGroupedLayout groups={groups} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('tmpl-002');
  });
});

describe('RecurrenceGroupedLayout — semantic HTML', () => {
  it('uses a <section> element for each non-empty frequency group', () => {
    const groups = {
      daily: [makeTemplate({ frequency: 'daily' })],
      weekly: [makeTemplate({ frequency: 'weekly', weeklyDays: [2] })],
      monthly: [],
    };
    const { container } = render(<RecurrenceGroupedLayout groups={groups} />);

    const sections = container.querySelectorAll('section');

    expect(sections).toHaveLength(2);
  });

  it('renders no <section> elements when all groups are empty', () => {
    const { container } = render(
      <RecurrenceGroupedLayout groups={emptyGroups} />,
    );

    expect(container.querySelectorAll('section')).toHaveLength(0);
  });
});
