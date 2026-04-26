import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { vi } from 'vitest';
import type { Task } from '../../types';
import { SortableTaskCard } from '../SortableTaskCard';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-sort-1',
    title: 'Sortable Task',
    status: 'todo',
    priority: 'medium',
    isArchived: false,
    position: 0,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    ...overrides,
  };
}

function SortableWrapper({
  children,
  items = ['task-sort-1'],
}: {
  children: React.ReactNode;
  items?: string[];
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  return (
    <DndContext sensors={sensors}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

function renderSortable(ui: React.ReactElement, items?: string[]) {
  return render(<SortableWrapper items={items}>{ui}</SortableWrapper>);
}

describe('SortableTaskCard', () => {
  it('renders the task title', () => {
    renderSortable(<SortableTaskCard task={makeTask()} />);

    expect(screen.getByText('Sortable Task')).toBeInTheDocument();
  });

  it('renders the inner TaskCard with data-task-id', () => {
    const { container } = renderSortable(
      <SortableTaskCard task={makeTask()} />,
    );

    expect(container.querySelector('[data-task-id]')).toBeInTheDocument();
  });

  it('has sortable role on the wrapper', () => {
    const { container } = renderSortable(
      <SortableTaskCard task={makeTask()} />,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute('role', 'button');
  });

  it('renders tasks of any status', () => {
    const inProgressTask = makeTask({
      id: 'task-ip-1',
      title: 'In Progress Task',
      status: 'in-progress',
    });

    renderSortable(<SortableTaskCard task={inProgressTask} />, ['task-ip-1']);

    expect(screen.getByText('In Progress Task')).toBeInTheDocument();
  });

  it('does not block delete button clicks', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    renderSortable(<SortableTaskCard task={makeTask()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('task-sort-1');
  });

  it('does not block archive button clicks on done tasks', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const doneTask = makeTask({
      id: 'task-done-1',
      status: 'done',
      isArchived: false,
    });

    renderSortable(<SortableTaskCard task={doneTask} onArchive={onArchive} />, [
      'task-done-1',
    ]);

    await user.click(screen.getByRole('button', { name: 'Archive' }));

    expect(onArchive).toHaveBeenCalledOnce();
    expect(onArchive).toHaveBeenCalledWith('task-done-1');
  });
});
