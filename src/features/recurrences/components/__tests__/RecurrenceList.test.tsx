import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RecurrenceTemplate } from '../../types/recurrence.types';
import { RecurrenceList } from '../RecurrenceList';

const templates: RecurrenceTemplate[] = [
  {
    id: 'template-uuid-001',
    title: 'Morning Standup',
    priority: 'high',
    frequency: 'daily',
    leadTimeDays: 0,
    isActive: true,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'template-uuid-002',
    title: 'Weekly Review',
    priority: 'medium',
    frequency: 'weekly',
    weeklyDays: [1, 5],
    leadTimeDays: 0,
    isActive: false,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  },
];

describe('RecurrenceList — rendering', () => {
  it('renders a RecurrenceCard for each template', () => {
    render(<RecurrenceList templates={templates} />);

    expect(screen.getByText('Morning Standup')).toBeInTheDocument();
    expect(screen.getByText('Weekly Review')).toBeInTheDocument();
  });

  it('renders correct number of article elements', () => {
    render(<RecurrenceList templates={templates} />);

    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('shows default empty message when list is empty and no emptyMessage prop', () => {
    render(<RecurrenceList templates={[]} />);

    expect(screen.getByText(/no recurrences found/i)).toBeInTheDocument();
  });

  it('shows custom emptyMessage when provided and list is empty', () => {
    render(
      <RecurrenceList
        templates={[]}
        emptyMessage="No templates yet. Create one!"
      />,
    );

    expect(
      screen.getByText('No templates yet. Create one!'),
    ).toBeInTheDocument();
  });

  it('does not show empty message when list has templates', () => {
    render(<RecurrenceList templates={templates} />);

    expect(screen.queryByText(/no recurrences found/i)).not.toBeInTheDocument();
  });
});

describe('RecurrenceList — callback pass-through', () => {
  it('passes onEdit callback through to each card', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<RecurrenceList templates={templates} onEdit={onEdit} />);

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith('template-uuid-001');
  });

  it('passes onDelete callback through to each card', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<RecurrenceList templates={templates} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[1]);

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('template-uuid-002');
  });
});
