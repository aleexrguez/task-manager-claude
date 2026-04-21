import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { GroupedReminder } from '../../types/reminder.types';
import { ReminderContainer } from '../ReminderContainer';

function buildReminder(taskId: string, taskTitle: string, tier: GroupedReminder['tier'] = 'urgent'): GroupedReminder {
  return {
    tier,
    topTask: { taskId, taskTitle, daysRemaining: 0 },
    extraCount: 0,
  };
}

describe('ReminderContainer', () => {
  it('renders nothing when reminders array is empty', () => {
    const { container } = render(
      <ReminderContainer
        reminders={[]}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders one ReminderToast when one reminder is provided', () => {
    render(
      <ReminderContainer
        reminders={[buildReminder('task-1', 'Write tests')]}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Write tests')).toBeInTheDocument();
  });

  it('renders two ReminderToasts when two reminders are provided', () => {
    render(
      <ReminderContainer
        reminders={[
          buildReminder('task-1', 'First task'),
          buildReminder('task-2', 'Second task'),
        ]}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
  });

  it('has aria-label "Due date reminders"', () => {
    render(
      <ReminderContainer
        reminders={[buildReminder('task-1', 'Some task')]}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('region', { name: 'Due date reminders' })).toBeInTheDocument();
  });

  it('has aria-live="assertive"', () => {
    render(
      <ReminderContainer
        reminders={[buildReminder('task-1', 'Some task')]}
        onDismiss={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    const region = screen.getByRole('region', { name: 'Due date reminders' });
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('passes onDismiss callback through to each toast', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <ReminderContainer
        reminders={[buildReminder('task-77', 'Dismissable task')]}
        onDismiss={onDismiss}
        onClick={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /dismiss reminder/i }));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith('task-77');
  });

  it('passes onClick callback through to each toast', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <ReminderContainer
        reminders={[buildReminder('task-55', 'Clickable task')]}
        onDismiss={vi.fn()}
        onClick={onClick}
      />,
    );

    await user.click(screen.getByText('Clickable task'));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith('task-55');
  });
});
