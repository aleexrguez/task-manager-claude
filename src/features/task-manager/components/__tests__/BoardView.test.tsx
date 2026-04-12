import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { Task } from '../../types';
import type { TaskBoard } from '../../utils';
import { BoardView } from '../BoardView';

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

const emptyBoard: TaskBoard = {
  todo: [],
  'in-progress': [],
  done: [],
};

describe('BoardView', () => {
  it('renders three columns with titles "Todo", "In Progress", and "Done"', () => {
    render(<BoardView board={emptyBoard} />);

    expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'In Progress' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Done' })).toBeInTheDocument();
  });

  it('renders the correct number of tasks in each column', () => {
    const board: TaskBoard = {
      todo: [
        makeTask({ id: 'id-1', title: 'Todo Task 1', status: 'todo' }),
        makeTask({ id: 'id-2', title: 'Todo Task 2', status: 'todo' }),
      ],
      'in-progress': [
        makeTask({
          id: 'id-3',
          title: 'In Progress Task 1',
          status: 'in-progress',
        }),
      ],
      done: [
        makeTask({ id: 'id-4', title: 'Done Task 1', status: 'done' }),
        makeTask({ id: 'id-5', title: 'Done Task 2', status: 'done' }),
        makeTask({ id: 'id-6', title: 'Done Task 3', status: 'done' }),
      ],
    };

    render(<BoardView board={board} />);

    expect(screen.getByText('Todo Task 1')).toBeInTheDocument();
    expect(screen.getByText('Todo Task 2')).toBeInTheDocument();
    expect(screen.getByText('In Progress Task 1')).toBeInTheDocument();
    expect(screen.getByText('Done Task 1')).toBeInTheDocument();
    expect(screen.getByText('Done Task 2')).toBeInTheDocument();
    expect(screen.getByText('Done Task 3')).toBeInTheDocument();
  });

  it('renders empty columns when a status has no tasks', () => {
    const board: TaskBoard = {
      todo: [makeTask({ id: 'id-1', title: 'Only Todo Task', status: 'todo' })],
      'in-progress': [],
      done: [],
    };

    render(<BoardView board={board} />);

    expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'In Progress' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Done' })).toBeInTheDocument();
    expect(screen.getByText('Only Todo Task')).toBeInTheDocument();
  });

  it('passes event handlers through to columns', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const board: TaskBoard = {
      todo: [
        makeTask({
          id: 'task-xyz',
          title: 'Handler Test Task',
          status: 'todo',
        }),
      ],
      'in-progress': [],
      done: [],
    };

    render(<BoardView board={board} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith('task-xyz');
  });
});
