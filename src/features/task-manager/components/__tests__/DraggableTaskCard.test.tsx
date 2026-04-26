import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { vi } from 'vitest';
import type { Task } from '../../types';
import { DraggableTaskCard } from '../DraggableTaskCard';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-drag-1',
    title: 'Draggable Task',
    status: 'todo',
    priority: 'medium',
    isArchived: false,
    position: 0,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    ...overrides,
  };
}

function renderWithDndContext(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('DraggableTaskCard', () => {
  it('renders the task title', () => {
    renderWithDndContext(<DraggableTaskCard task={makeTask()} />);

    expect(screen.getByText('Draggable Task')).toBeInTheDocument();
  });

  it('renders a drag handle with draggable attributes', () => {
    renderWithDndContext(<DraggableTaskCard task={makeTask()} />);

    const handle = screen.getByRole('button', { name: /drag handle/i });
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute('aria-roledescription', 'draggable');
  });

  it('renders the inner TaskCard with data-task-id', () => {
    const { container } = renderWithDndContext(
      <DraggableTaskCard task={makeTask()} />,
    );

    expect(container.querySelector('[data-task-id]')).toBeInTheDocument();
  });

  it('renders tasks of any status', () => {
    const inProgressTask = makeTask({
      id: 'task-ip-1',
      title: 'In Progress Task',
      status: 'in-progress',
    });

    renderWithDndContext(<DraggableTaskCard task={inProgressTask} />);

    expect(screen.getByText('In Progress Task')).toBeInTheDocument();
  });

  it('does not block delete button clicks', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    renderWithDndContext(
      <DraggableTaskCard task={makeTask()} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('task-drag-1');
  });

  it('drag handle is inside the group/drag ancestor so it becomes visible on hover', () => {
    const { container } = renderWithDndContext(
      <DraggableTaskCard task={makeTask()} />,
    );

    // The outer wrapper must have group/drag so the handle's group-hover/drag:opacity-100 works
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass('group/drag');

    // The handle must be a descendant of that wrapper
    const handle = screen.getByRole('button', { name: /drag handle/i });
    expect(wrapper?.contains(handle)).toBe(true);
  });

  it('does not block archive button clicks on done tasks', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const doneTask = makeTask({
      id: 'task-done-1',
      status: 'done',
      isArchived: false,
    });

    renderWithDndContext(
      <DraggableTaskCard task={doneTask} onArchive={onArchive} />,
    );

    await user.click(screen.getByRole('button', { name: /archive/i }));

    expect(onArchive).toHaveBeenCalledOnce();
    expect(onArchive).toHaveBeenCalledWith('task-done-1');
  });
});
