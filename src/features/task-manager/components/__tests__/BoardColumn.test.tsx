import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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
    position: 0,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    ...overrides,
  };
}

function DndWrapper({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );
  return <DndContext sensors={sensors}>{children}</DndContext>;
}

function renderWithDnd(ui: React.ReactElement) {
  return render(<DndWrapper>{ui}</DndWrapper>);
}

describe('BoardColumn', () => {
  it('renders the column title', () => {
    renderWithDnd(<BoardColumn title="Todo" tasks={[]} status="todo" />);

    expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
  });

  it('renders the task count as a badge', () => {
    const tasks = [
      makeTask({ id: 'id-1', title: 'Task 1' }),
      makeTask({ id: 'id-2', title: 'Task 2' }),
      makeTask({ id: 'id-3', title: 'Task 3' }),
    ];

    renderWithDnd(<BoardColumn title="Todo" tasks={tasks} status="todo" />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders a TaskCard for each task in the column', () => {
    const tasks = [
      makeTask({ id: 'id-1', title: 'First Task' }),
      makeTask({ id: 'id-2', title: 'Second Task' }),
    ];

    renderWithDnd(<BoardColumn title="Todo" tasks={tasks} status="todo" />);

    expect(screen.getByText('First Task')).toBeInTheDocument();
    expect(screen.getByText('Second Task')).toBeInTheDocument();
  });

  it('renders an empty state message when tasks array is empty', () => {
    renderWithDnd(<BoardColumn title="Done" tasks={[]} status="done" />);

    expect(screen.getByText(/no tasks/i)).toBeInTheDocument();
  });

  it('passes onDelete callback through to TaskCard components', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const tasks = [makeTask({ id: 'task-abc', title: 'Deletable Task' })];

    renderWithDnd(
      <BoardColumn
        title="Todo"
        tasks={tasks}
        onDelete={onDelete}
        status="todo"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('task-abc');
  });

  it('renders task cards with sortable attributes', () => {
    const tasks = [makeTask({ id: 'sort-task-1', title: 'Sortable Task' })];

    const { container } = renderWithDnd(
      <BoardColumn title="Todo" tasks={tasks} status="todo" />,
    );

    // useSortable applies role="button" on the sortable wrapper
    const sortableWrapper = container.querySelector('[role="button"]');
    expect(sortableWrapper).toBeInTheDocument();
  });

  it('does not apply over-indicator ring in normal (non-dragging) state', () => {
    const { container } = renderWithDnd(
      <BoardColumn title="Todo" tasks={[]} status="todo" />,
    );

    const columnRoot = container.querySelector('.flex.flex-col.rounded-lg');
    expect(columnRoot).not.toHaveClass('ring-2');
  });
});
