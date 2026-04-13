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
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TaskCard keyboard accessibility', () => {
  it('has tabIndex=0 when onClick is provided', () => {
    const onClick = vi.fn();

    render(<TaskCard task={mockTask} onClick={onClick} />);

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('calls onClick when Enter is pressed on the card', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<TaskCard task={mockTask} onClick={onClick} />);

    const card = screen.getByRole('article');
    card.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith('test-id');
  });

  it('calls onClick when Space is pressed on the card', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<TaskCard task={mockTask} onClick={onClick} />);

    const card = screen.getByRole('article');
    card.focus();
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith('test-id');
  });

  it('does not call onClick when Enter is pressed on Edit button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onEdit = vi.fn();

    render(<TaskCard task={mockTask} onClick={onClick} onEdit={onEdit} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    editButton.focus();
    await user.keyboard('{Enter}');

    expect(onClick).not.toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('does not have tabIndex=0 when onClick is not provided', () => {
    render(<TaskCard task={mockTask} />);

    const card = screen.getByRole('article');
    expect(card).not.toHaveAttribute('tabindex', '0');
  });
});
