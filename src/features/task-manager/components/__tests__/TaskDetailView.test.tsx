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
  isArchived: false,
  position: 0,
  createdAt: '2026-03-15T10:00:00.000Z',
  updatedAt: '2026-03-20T15:30:00.000Z',
};

describe('TaskDetailView', () => {
  it('renders the task title as a heading', () => {
    render(
      <TaskDetailView task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(
      screen.getByRole('heading', { name: 'Test Task Title' }),
    ).toBeInTheDocument();
  });

  it('renders the task description', () => {
    render(
      <TaskDetailView task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />,
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
      />,
    );

    expect(screen.getByText(/no description/i)).toBeInTheDocument();
  });

  it('renders the StatusBadge with correct status', () => {
    render(
      <TaskDetailView task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders the PriorityIndicator with correct priority', () => {
    render(
      <TaskDetailView task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders formatted created date', () => {
    render(
      <TaskDetailView task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />,
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
      <TaskDetailView task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />,
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
      <TaskDetailView task={mockTask} onEdit={onEdit} onDelete={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('calls onDelete when Delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskDetailView task={mockTask} onEdit={vi.fn()} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledOnce();
  });
});

describe('TaskDetailView — Block 1 fields', () => {
  const baseTask: Task = {
    id: 'test-block1-uuid',
    title: 'Block 1 Detail Task',
    status: 'in-progress',
    priority: 'medium',
    isArchived: false,
    position: 0,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  };

  it('renders due date section in metadata when task has a dueDate', () => {
    const task: Task = { ...baseTask, dueDate: '2026-05-15' };

    render(<TaskDetailView task={task} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Due Date')).toBeInTheDocument();
  });

  it('does not render due date label when task has no dueDate', () => {
    render(
      <TaskDetailView task={baseTask} onEdit={vi.fn()} onDelete={vi.fn()} />,
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

    render(<TaskDetailView task={task} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText(/Completed/)).toBeInTheDocument();
  });

  it('does not render completedAt when task is not done', () => {
    const task: Task = { ...baseTask, status: 'todo' };

    render(<TaskDetailView task={task} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByText(/Completed/)).not.toBeInTheDocument();
  });
});

describe('TaskDetailView — inline editing', () => {
  const editingTask: Task = {
    id: 'edit-uuid-123',
    title: 'Editable Task',
    description: 'Some description',
    status: 'todo',
    priority: 'medium',
    isArchived: false,
    position: 0,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  };

  it('shows TaskForm when isEditing is true', () => {
    render(
      <TaskDetailView
        task={editingTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isEditing={true}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: editingTask.title }),
    ).not.toBeInTheDocument();
  });

  it('hides Edit and Delete buttons when isEditing is true', () => {
    render(
      <TaskDetailView
        task={editingTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isEditing={true}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });

  it('shows Cancel button when isEditing is true and calls onCancel on click', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskDetailView
        task={editingTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isEditing={true}
        onSave={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onSave when form is submitted in edit mode', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskDetailView
        task={editingTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isEditing={true}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSave).toHaveBeenCalledOnce();
  });

  it('shows view mode by default when isEditing is not provided', () => {
    render(
      <TaskDetailView task={editingTask} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(
      screen.getByRole('heading', { name: editingTask.title }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/title/i)).toBeNull();
  });
});

describe('TaskDetailView — recurrence info', () => {
  const recurringTask: Task = {
    id: 'recur-uuid-123',
    title: 'Recurring Task',
    status: 'todo',
    priority: 'low',
    isArchived: false,
    position: 0,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  };

  it('shows Recurring badge when isRecurring is true', () => {
    render(
      <TaskDetailView
        task={recurringTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isRecurring={true}
      />,
    );

    expect(screen.getByText('Recurring')).toBeInTheDocument();
  });

  it('shows frequency label when frequencyLabel is provided', () => {
    render(
      <TaskDetailView
        task={recurringTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isRecurring={true}
        frequencyLabel="Weekly (Mon, Wed)"
      />,
    );

    expect(screen.getByText('Weekly (Mon, Wed)')).toBeInTheDocument();
  });

  it('does not show Recurring badge when isRecurring is false or not provided', () => {
    render(
      <TaskDetailView
        task={recurringTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByText('Recurring')).not.toBeInTheDocument();
  });

  it('does not show frequency label when frequencyLabel is not provided', () => {
    render(
      <TaskDetailView
        task={recurringTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isRecurring={true}
      />,
    );

    // Badge renders but no frequency text alongside it
    expect(screen.getByText('Recurring')).toBeInTheDocument();
    expect(screen.queryByText(/weekly|daily|monthly/i)).not.toBeInTheDocument();
  });
});
