import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { Task } from '../../types';
import { TaskCard } from '../TaskCard';

const mockTask: Task = {
  id: 'test-id',
  title: 'Test Task',
  description: 'Description',
  status: 'todo' as const,
  priority: 'medium' as const,
  isArchived: false,
  position: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TaskCard keyboard accessibility', () => {
  it('renders a focusable overlay button when onClick is provided', () => {
    const onClick = vi.fn();

    render(<TaskCard task={mockTask} onClick={onClick} />);

    const overlay = screen.getByRole('button', { name: 'Test Task' });
    expect(overlay).toBeInTheDocument();
  });

  it('calls onClick when Enter is pressed on the overlay button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<TaskCard task={mockTask} onClick={onClick} />);

    const overlay = screen.getByRole('button', { name: 'Test Task' });
    overlay.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith('test-id');
  });

  it('calls onClick when Space is pressed on the overlay button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<TaskCard task={mockTask} onClick={onClick} />);

    const overlay = screen.getByRole('button', { name: 'Test Task' });
    overlay.focus();
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith('test-id');
  });

  it('does not render an overlay button when onClick is not provided', () => {
    render(<TaskCard task={mockTask} />);

    expect(
      screen.queryByRole('button', { name: 'Test Task' }),
    ).not.toBeInTheDocument();
  });
});
