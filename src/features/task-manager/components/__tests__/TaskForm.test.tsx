import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskForm } from '../TaskForm';

describe('TaskForm — dueDate support', () => {
  it('renders a date input field for dueDate', () => {
    render(<TaskForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toHaveAttribute('type', 'date');
  });

  it('dueDate input is empty by default', () => {
    render(<TaskForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/due date/i)).toHaveValue('');
  });

  it('populates dueDate from initialValues', () => {
    render(
      <TaskForm onSubmit={vi.fn()} initialValues={{ dueDate: '2026-05-15' }} />,
    );

    expect(screen.getByLabelText(/due date/i)).toHaveValue('2026-05-15');
  });

  it('includes dueDate in submit payload when filled', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<TaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'My Task');
    await user.type(screen.getByLabelText(/due date/i), '2026-05-15');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: '2026-05-15' }),
    );
  });

  it('does NOT include dueDate in submit payload when empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<TaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'My Task');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.dueDate).toBeUndefined();
  });
});
