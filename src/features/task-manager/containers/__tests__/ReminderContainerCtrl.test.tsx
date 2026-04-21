import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReminderContainerCtrl } from '../ReminderContainerCtrl';
import { useDueReminders } from '../../hooks/use-due-reminders';
import { useReminderStore } from '../../store/reminder.store';
import type { GroupedReminder } from '../../types/reminder.types';
import type { Task } from '../../types/task.types';

vi.mock('../../hooks/use-due-reminders');
vi.mock('../../store/reminder.store');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function buildReminder(
  taskId: string,
  taskTitle: string,
  tier: GroupedReminder['tier'] = 'urgent',
): GroupedReminder {
  return {
    tier,
    topTask: { taskId, taskTitle, daysRemaining: 0 },
    extraCount: 0,
  };
}

const mockDismiss = vi.fn();

function setupStoreMock() {
  vi.mocked(useReminderStore).mockImplementation((selector) =>
    selector({
      dismissedTaskIds: new Set(),
      dismiss: mockDismiss,
      clearDismissed: vi.fn(),
    }),
  );
}

function renderCtrl(tasks: Task[] = []) {
  return render(
    <MemoryRouter>
      <ReminderContainerCtrl tasks={tasks} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setupStoreMock();
});

describe('ReminderContainerCtrl — rendering', () => {
  it('renders nothing when useDueReminders returns empty array', () => {
    vi.mocked(useDueReminders).mockReturnValue([]);

    const { container } = renderCtrl();

    expect(container.firstChild).toBeNull();
  });

  it('renders ReminderContainer when reminders exist', () => {
    vi.mocked(useDueReminders).mockReturnValue([
      buildReminder('task-1', 'Write tests'),
    ]);

    renderCtrl();

    expect(
      screen.getByRole('region', { name: 'Due date reminders' }),
    ).toBeInTheDocument();
  });
});

describe('ReminderContainerCtrl — dismiss', () => {
  it('calls dismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useDueReminders).mockReturnValue([
      buildReminder('task-99', 'Dismiss me'),
    ]);

    renderCtrl();

    await user.click(screen.getByRole('button', { name: /dismiss reminder/i }));

    expect(mockDismiss).toHaveBeenCalledOnce();
    expect(mockDismiss).toHaveBeenCalledWith('task-99');
  });
});

describe('ReminderContainerCtrl — navigation', () => {
  it('navigates to /app/tasks when task title is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useDueReminders).mockReturnValue([
      buildReminder('task-1', 'Navigate task'),
    ]);

    renderCtrl();

    await user.click(screen.getByText('Navigate task'));

    expect(mockNavigate).toHaveBeenCalledWith('/app/tasks');
  });

  it('navigates to /app/tasks when "+N more" is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useDueReminders).mockReturnValue([
      { ...buildReminder('task-1', 'Main task'), extraCount: 3 },
    ]);

    renderCtrl();

    await user.click(screen.getByRole('button', { name: /\+3 more/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/app/tasks');
  });
});

describe('ReminderContainerCtrl — auto-dismiss timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-dismisses urgent reminder after 10000ms', () => {
    vi.mocked(useDueReminders).mockReturnValue([
      buildReminder('task-urgent', 'Urgent task', 'urgent'),
    ]);

    renderCtrl();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockDismiss).toHaveBeenCalledWith('task-urgent');
  });

  it('auto-dismisses warning reminder after 8000ms', () => {
    vi.mocked(useDueReminders).mockReturnValue([
      buildReminder('task-warning', 'Warning task', 'warning'),
    ]);

    renderCtrl();

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(mockDismiss).toHaveBeenCalledWith('task-warning');
  });

  it('does NOT auto-dismiss critical reminder after 15000ms', () => {
    vi.mocked(useDueReminders).mockReturnValue([
      buildReminder('task-critical', 'Critical task', 'critical'),
    ]);

    renderCtrl();

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it('cleans up timers on unmount', () => {
    vi.mocked(useDueReminders).mockReturnValue([
      buildReminder('task-urgent', 'Urgent task', 'urgent'),
    ]);

    const { unmount } = renderCtrl();

    unmount();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockDismiss).not.toHaveBeenCalled();
  });
});
