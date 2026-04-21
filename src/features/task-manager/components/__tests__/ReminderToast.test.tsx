import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { GroupedReminder } from '../../types/reminder.types';
import { ReminderToast } from '../ReminderToast';

function buildReminder(overrides: Partial<GroupedReminder> = {}): GroupedReminder {
  return {
    tier: 'urgent',
    topTask: { taskId: 'task-1', taskTitle: 'Write unit tests', daysRemaining: 0 },
    extraCount: 0,
    ...overrides,
  };
}

describe('ReminderToast', () => {
  it('renders task title for single reminder (extraCount = 0)', () => {
    render(
      <ReminderToast
        reminder={buildReminder()}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Write unit tests')).toBeInTheDocument();
  });

  it('renders "Overdue" label for critical tier with daysRemaining = -2', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ tier: 'critical', topTask: { taskId: 'task-1', taskTitle: 'Fix bug', daysRemaining: -2 } })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders "Due today" label for urgent tier with daysRemaining = 0', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ tier: 'urgent', topTask: { taskId: 'task-1', taskTitle: 'Submit report', daysRemaining: 0 } })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Due today')).toBeInTheDocument();
  });

  it('renders "Tomorrow" label for warning tier with daysRemaining = 1', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ tier: 'warning', topTask: { taskId: 'task-1', taskTitle: 'Prepare slides', daysRemaining: 1 } })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
  });

  it('renders "+N more" text when extraCount > 0', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ extraCount: 3 })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('+3 more')).toBeInTheDocument();
  });

  it('does NOT render "+N more" when extraCount === 0', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ extraCount: 0 })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });

  it('calls onDismiss with taskId when dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <ReminderToast
        reminder={buildReminder({ topTask: { taskId: 'task-99', taskTitle: 'Test task', daysRemaining: 0 } })}
        onDismiss={onDismiss}
        onClick={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith('task-99');
  });

  it('calls onClick with taskId when task title area is clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <ReminderToast
        reminder={buildReminder({ topTask: { taskId: 'task-42', taskTitle: 'Clickable task', daysRemaining: 0 } })}
        onDismiss={vi.fn()}
        onClick={onClick}
      />,
    );

    await user.click(screen.getByText('Clickable task'));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith('task-42');
  });

  it('calls onClickMore when "+N more" is clicked', async () => {
    const onClickMore = vi.fn();
    const user = userEvent.setup();

    render(
      <ReminderToast
        reminder={buildReminder({ extraCount: 2 })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
        onClickMore={onClickMore}
      />,
    );

    await user.click(screen.getByText('+2 more'));

    expect(onClickMore).toHaveBeenCalledOnce();
  });

  it('has role="alert" for critical tier', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ tier: 'critical', topTask: { taskId: 'task-1', taskTitle: 'Critical task', daysRemaining: -1 } })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has role="status" for urgent tier', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ tier: 'urgent' })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has role="status" for warning tier', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ tier: 'warning', topTask: { taskId: 'task-1', taskTitle: 'Warning task', daysRemaining: 1 } })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies red styling for critical tier', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ tier: 'critical', topTask: { taskId: 'task-1', taskTitle: 'Critical task', daysRemaining: -1 } })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert').className).toMatch(/red/);
  });

  it('applies amber styling for urgent tier', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ tier: 'urgent' })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('status').className).toMatch(/amber/);
  });

  it('applies blue styling for warning tier', () => {
    render(
      <ReminderToast
        reminder={buildReminder({ tier: 'warning', topTask: { taskId: 'task-1', taskTitle: 'Warning task', daysRemaining: 1 } })}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('status').className).toMatch(/blue/);
  });
});
