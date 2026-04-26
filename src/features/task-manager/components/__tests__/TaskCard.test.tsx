import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types';
import { TaskCard } from '../TaskCard';

const mockTask: Task = {
  id: 'task-uuid-001',
  title: 'Fix login bug',
  description: 'Users cannot log in with email containing plus signs',
  status: 'in-progress',
  priority: 'high',
  isArchived: false,
  position: 0,
  createdAt: '2026-03-15T10:00:00.000Z',
  updatedAt: '2026-03-20T15:30:00.000Z',
};

describe('TaskCard', () => {
  it('calls onClick with task id when card body is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<TaskCard task={mockTask} onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Fix login bug' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith('task-uuid-001');
  });

  it('does not call onClick when Delete button is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onDelete = vi.fn();

    render(<TaskCard task={mockTask} onClick={onClick} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onClick).not.toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('does not throw when onClick is not provided', async () => {
    const user = userEvent.setup();

    render(<TaskCard task={mockTask} />);

    await expect(
      user.click(screen.getByText('Fix login bug')),
    ).resolves.not.toThrow();
  });
});

describe('TaskCard — Block 1 features', () => {
  const baseTask: Task = {
    id: 'task-block1-001',
    title: 'Block 1 Test Task',
    status: 'in-progress',
    priority: 'medium',
    isArchived: false,
    position: 0,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-04-17T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a countdown badge in the badge row when task has a dueDate', () => {
    // dueDate 5 days from pinned today (2026-04-17) → "5 days left"
    const task: Task = { ...baseTask, dueDate: '2026-04-22' };

    render(<TaskCard task={task} />);

    expect(screen.getByText('5 days left')).toBeInTheDocument();
    expect(screen.queryByText('Due:')).not.toBeInTheDocument();
  });

  it('does not render due date section when task has no dueDate', () => {
    render(<TaskCard task={baseTask} />);

    expect(
      screen.queryByText(/days left|Due today|Tomorrow|Overdue/i),
    ).not.toBeInTheDocument();
  });

  it('renders completedAt for done tasks', () => {
    const task: Task = {
      ...baseTask,
      status: 'done',
      completedAt: '2026-04-10T14:30:00.000Z',
    };

    render(<TaskCard task={task} />);

    expect(screen.getByText(/Completed/)).toBeInTheDocument();
  });

  it('does not render completedAt for non-done tasks', () => {
    const task: Task = { ...baseTask, status: 'todo' };

    render(<TaskCard task={task} />);

    expect(screen.queryByText(/Completed/)).not.toBeInTheDocument();
  });

  it('renders Archive button for done tasks when onArchive is provided', () => {
    const task: Task = { ...baseTask, status: 'done', isArchived: false };

    render(<TaskCard task={task} onArchive={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /archive/i }),
    ).toBeInTheDocument();
  });

  it('renders Unarchive button for archived done tasks', () => {
    const task: Task = { ...baseTask, status: 'done', isArchived: true };

    render(<TaskCard task={task} onArchive={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /unarchive/i }),
    ).toBeInTheDocument();
  });

  it('does NOT render Archive button for non-done tasks', () => {
    const task: Task = { ...baseTask, status: 'todo', isArchived: false };

    render(<TaskCard task={task} onArchive={vi.fn()} />);

    expect(
      screen.queryByRole('button', { name: /archive/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onArchive with task id when Archive button is clicked', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const task: Task = { ...baseTask, status: 'done', isArchived: false };

    render(<TaskCard task={task} onArchive={onArchive} />);

    await user.click(screen.getByRole('button', { name: /archive/i }));

    expect(onArchive).toHaveBeenCalledOnce();
    expect(onArchive).toHaveBeenCalledWith('task-block1-001');
  });

  it('Archive button click does not trigger onClick', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const onClick = vi.fn();
    const task: Task = { ...baseTask, status: 'done', isArchived: false };

    render(<TaskCard task={task} onArchive={onArchive} onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: /archive/i }));

    expect(onArchive).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('TaskCard — recurring task behavior', () => {
  const baseRecurringTask: Task = {
    id: 'task-recurring-001',
    title: 'Daily Standup',
    status: 'todo',
    priority: 'medium',
    isArchived: false,
    position: 0,
    createdAt: '2026-04-17T08:00:00.000Z',
    updatedAt: '2026-04-17T08:00:00.000Z',
    recurrenceTemplateId: 'template-uuid-001',
    recurrenceDateKey: '2026-04-17',
  };

  const baseNormalTask: Task = {
    id: 'task-normal-001',
    title: 'Normal Task',
    status: 'todo',
    priority: 'medium',
    isArchived: false,
    position: 0,
    createdAt: '2026-04-17T08:00:00.000Z',
    updatedAt: '2026-04-17T08:00:00.000Z',
  };

  it('shows "Recurring" badge when task has recurrenceDateKey', () => {
    render(<TaskCard task={baseRecurringTask} />);

    expect(screen.getByText('Recurring')).toBeInTheDocument();
  });

  it('does not show "Recurring" badge when task has no recurrenceDateKey', () => {
    render(<TaskCard task={baseNormalTask} />);

    expect(screen.queryByText('Recurring')).not.toBeInTheDocument();
  });

  it('hides delete button for recurring tasks even when onDelete is provided', () => {
    const onDelete = vi.fn();

    render(<TaskCard task={baseRecurringTask} onDelete={onDelete} />);

    expect(
      screen.queryByRole('button', { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it('still shows archive button for done recurring tasks', () => {
    const onArchive = vi.fn();
    const doneRecurringTask: Task = {
      ...baseRecurringTask,
      status: 'done',
    };

    render(<TaskCard task={doneRecurringTask} onArchive={onArchive} />);

    expect(
      screen.getByRole('button', { name: /archive/i }),
    ).toBeInTheDocument();
  });

  it('archive callback still works for recurring tasks', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const doneRecurringTask: Task = {
      ...baseRecurringTask,
      status: 'done',
    };

    render(<TaskCard task={doneRecurringTask} onArchive={onArchive} />);

    await user.click(screen.getByRole('button', { name: /archive/i }));

    expect(onArchive).toHaveBeenCalledOnce();
    expect(onArchive).toHaveBeenCalledWith('task-recurring-001');
  });
});
