import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types';
import { TaskDetailView } from '../TaskDetailView';

const mockTask: Task = {
  id: 'test-uuid-123',
  title: 'Test Task Title',
  description: 'This is a test description',
  status: 'in-progress',
  priority: 'high',
  createdAt: '2026-03-15T10:00:00.000Z',
  updatedAt: '2026-03-20T15:30:00.000Z',
};

describe('TaskDetailView', () => {
  it('renders the task title as a heading', () => {
    render(
      <TaskDetailView
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Test Task Title' }),
    ).toBeInTheDocument();
  });

  it('renders the task description', () => {
    render(
      <TaskDetailView
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('renders "No description" when description is undefined', () => {
    const taskWithoutDescription: Task = {
      ...mockTask,
      description: undefined,
    };

    render(
      <TaskDetailView
        task={taskWithoutDescription}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText(/no description/i)).toBeInTheDocument();
  });

  it('renders the StatusBadge with correct status', () => {
    render(
      <TaskDetailView
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders the PriorityIndicator with correct priority', () => {
    render(
      <TaskDetailView
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders formatted created date', () => {
    render(
      <TaskDetailView
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const formattedDate = new Date(
      '2026-03-15T10:00:00.000Z',
    ).toLocaleDateString();
    expect(
      screen.getByText(new RegExp(formattedDate.replace(/\//g, '\\/'))),
    ).toBeInTheDocument();
  });

  it('renders formatted updated date', () => {
    render(
      <TaskDetailView
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const formattedDate = new Date(
      '2026-03-20T15:30:00.000Z',
    ).toLocaleDateString();
    expect(
      screen.getByText(new RegExp(formattedDate.replace(/\//g, '\\/'))),
    ).toBeInTheDocument();
  });

  it('calls onEdit when Edit button is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskDetailView
        task={mockTask}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('calls onDelete when Delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskDetailView
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('calls onBack when Back button is clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskDetailView
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={onBack}
      />,
    );

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});

describe('TaskDetailView — Block 1 fields', () => {
  const baseTask: Task = {
    id: 'test-block1-uuid',
    title: 'Block 1 Detail Task',
    status: 'in-progress',
    priority: 'medium',
    isArchived: false,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  };

  it('renders dueDate in metadata when task has a dueDate', () => {
    const task: Task = { ...baseTask, dueDate: '2026-05-15' };

    render(
      <TaskDetailView
        task={task}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText(/2026-05-15/)).toBeInTheDocument();
  });

  it('does not render due date label when task has no dueDate', () => {
    render(
      <TaskDetailView
        task={baseTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.queryByText(/due date/i)).not.toBeInTheDocument();
  });

  it('renders completedAt when task is done', () => {
    const task: Task = {
      ...baseTask,
      status: 'done',
      completedAt: '2026-04-10T14:30:00.000Z',
      isArchived: false,
    };

    render(
      <TaskDetailView
        task={task}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText(/Completed/)).toBeInTheDocument();
  });

  it('does not render completedAt when task is not done', () => {
    const task: Task = { ...baseTask, status: 'todo' };

    render(
      <TaskDetailView
        task={task}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Completed/)).not.toBeInTheDocument();
  });
});
