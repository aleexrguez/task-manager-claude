import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { Task } from '../../types';
import { BoardColumn } from '../BoardColumn';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-id-1',
    title: 'Test Task',
    status: 'todo',
    priority: 'medium',
    isArchived: false,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('BoardColumn', () => {
  it('renders the column title', () => {
    render(<BoardColumn title="Todo" tasks={[]} />);

    expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
  });

  it('renders the task count as a badge', () => {
    const tasks = [
      makeTask({ id: 'id-1', title: 'Task 1' }),
      makeTask({ id: 'id-2', title: 'Task 2' }),
      makeTask({ id: 'id-3', title: 'Task 3' }),
    ];

    render(<BoardColumn title="Todo" tasks={tasks} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders a TaskCard for each task in the column', () => {
    const tasks = [
      makeTask({ id: 'id-1', title: 'First Task' }),
      makeTask({ id: 'id-2', title: 'Second Task' }),
    ];

    render(<BoardColumn title="Todo" tasks={tasks} />);

    expect(screen.getByText('First Task')).toBeInTheDocument();
    expect(screen.getByText('Second Task')).toBeInTheDocument();
  });

  it('renders an empty state message when tasks array is empty', () => {
    render(<BoardColumn title="Done" tasks={[]} />);

    expect(screen.getByText(/no tasks/i)).toBeInTheDocument();
  });

  it('passes onEdit callback through to TaskCard components', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const tasks = [makeTask({ id: 'task-abc', title: 'Editable Task' })];

    render(<BoardColumn title="Todo" tasks={tasks} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith('task-abc');
  });

  it('passes onDelete callback through to TaskCard components', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const tasks = [makeTask({ id: 'task-abc', title: 'Deletable Task' })];

    render(<BoardColumn title="Todo" tasks={tasks} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('task-abc');
  });
});
