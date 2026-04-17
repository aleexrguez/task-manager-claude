import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RecurrenceTemplate } from '../../types/recurrence.types';
import { RecurrenceCard } from '../RecurrenceCard';

const baseTemplate: RecurrenceTemplate = {
  id: 'template-uuid-001',
  title: 'Morning Standup',
  priority: 'high',
  frequency: 'daily',
  isActive: true,
  createdAt: '2026-04-01T10:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z',
};

const weeklyTemplate: RecurrenceTemplate = {
  id: 'template-uuid-002',
  title: 'Weekly Review',
  priority: 'medium',
  frequency: 'weekly',
  weeklyDays: [1, 3, 5],
  isActive: true,
  createdAt: '2026-04-01T10:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z',
};

const monthlyTemplate: RecurrenceTemplate = {
  id: 'template-uuid-003',
  title: 'Monthly Report',
  priority: 'low',
  frequency: 'monthly',
  monthlyDay: 15,
  isActive: false,
  createdAt: '2026-04-01T10:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z',
};

describe('RecurrenceCard — rendering', () => {
  it('displays the template title', () => {
    render(<RecurrenceCard template={baseTemplate} />);

    expect(screen.getByText('Morning Standup')).toBeInTheDocument();
  });

  it('displays the frequency label for a daily template', () => {
    render(<RecurrenceCard template={baseTemplate} />);

    expect(screen.getByText('Daily')).toBeInTheDocument();
  });

  it('displays the frequency label with days for a weekly template', () => {
    render(<RecurrenceCard template={weeklyTemplate} />);

    expect(
      screen.getByText('Weekly (Mon, Wed, Fri)'),
    ).toBeInTheDocument();
  });

  it('displays the frequency label with ordinal day for a monthly template', () => {
    render(<RecurrenceCard template={monthlyTemplate} />);

    expect(screen.getByText('Monthly (15th)')).toBeInTheDocument();
  });

  it('displays the priority badge', () => {
    render(<RecurrenceCard template={baseTemplate} />);

    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('shows "Active" indicator when template is active', () => {
    render(<RecurrenceCard template={baseTemplate} />);

    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it('shows "Paused" indicator when template is not active', () => {
    render(<RecurrenceCard template={monthlyTemplate} />);

    expect(screen.getByText(/paused/i)).toBeInTheDocument();
  });
});

describe('RecurrenceCard — callbacks', () => {
  it('renders Edit button when onEdit is provided', () => {
    render(<RecurrenceCard template={baseTemplate} onEdit={vi.fn()} />);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('renders Delete button when onDelete is provided', () => {
    render(<RecurrenceCard template={baseTemplate} onDelete={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /delete/i }),
    ).toBeInTheDocument();
  });

  it('does not render Edit button when onEdit is not provided', () => {
    render(<RecurrenceCard template={baseTemplate} />);

    expect(
      screen.queryByRole('button', { name: /edit/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onEdit with template id when Edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<RecurrenceCard template={baseTemplate} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith('template-uuid-001');
  });

  it('calls onDelete with template id when Delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<RecurrenceCard template={baseTemplate} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('template-uuid-001');
  });
});
