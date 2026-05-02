import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TaskDashboardContainer } from '../TaskDashboardContainer';
import { useTaskUIStore } from '../../store';
import type { Task } from '../../types';

// Mock child containers to isolate dashboard tests
vi.mock('../TaskListContainer', () => ({
  TaskListContainer: () => (
    <div data-testid="task-list-container">TaskListContainer</div>
  ),
}));
vi.mock('../CreateTaskContainer', () => ({
  CreateTaskContainer: () => null,
}));
vi.mock('../EditTaskContainer', () => ({
  EditTaskContainer: () => null,
}));

// Mock the API
vi.mock('../../api', () => ({
  fetchTasks: vi.fn(),
  fetchTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  archiveTask: vi.fn(),
  unarchiveTask: vi.fn(),
  purgeTasks: vi.fn(),
}));

// Mock auth — provide authenticated user for hooks with enabled: !!user
vi.mock('@/features/auth/hooks', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    session: null,
    isLoading: false,
  }),
}));

import { fetchTasks } from '../../api';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('TaskDashboardContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskUIStore.setState({
      statusFilter: 'all',
      priorityFilter: 'all',
      searchQuery: '',
      viewMode: 'list',
      showArchived: false,
    });

    const mockTasks = [
      makeTask({
        id: 'task-1',
        title: 'Task One',
        priority: 'high',
        status: 'todo',
      }),
      makeTask({
        id: 'task-2',
        title: 'Task Two',
        priority: 'low',
        status: 'done',
        completedAt: '2026-01-09T10:00:00.000Z',
      }),
    ];
    (fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValue({
      tasks: mockTasks,
      total: mockTasks.length,
    });
  });

  it('renders ViewToggle component with List and Board buttons', async () => {
    const Wrapper = createWrapper();
    render(<TaskDashboardContainer />, { wrapper: Wrapper });

    expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /board/i })).toBeInTheDocument();
  });

  it('changes viewMode in store when Board button is clicked', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(<TaskDashboardContainer />, { wrapper: Wrapper });

    const boardButton = screen.getByRole('button', { name: /board/i });
    await user.click(boardButton);

    expect(useTaskUIStore.getState().viewMode).toBe('board');
  });

  it('excludes archived done tasks from stats when showArchived is off', async () => {
    const tasks = [
      makeTask({ id: 't1', status: 'todo' }),
      makeTask({ id: 't2', status: 'done', isArchived: true }),
      makeTask({ id: 't3', status: 'done', isArchived: false }),
    ];
    (fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValue({
      tasks,
      total: tasks.length,
    });
    useTaskUIStore.setState({ showArchived: false });

    const Wrapper = createWrapper();
    render(<TaskDashboardContainer />, { wrapper: Wrapper });

    // Wait for data to load — subtitle reflects visible tasks
    const subtitle = await screen.findByText('2 tasks shown');
    expect(subtitle).toBeInTheDocument();
  });

  it('includes archived done tasks in stats when showArchived is on', async () => {
    const tasks = [
      makeTask({ id: 't1', status: 'todo' }),
      makeTask({ id: 't2', status: 'done', isArchived: true }),
      makeTask({ id: 't3', status: 'done', isArchived: false }),
    ];
    (fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValue({
      tasks,
      total: tasks.length,
    });
    useTaskUIStore.setState({ showArchived: true });

    const Wrapper = createWrapper();
    render(<TaskDashboardContainer />, { wrapper: Wrapper });

    const subtitle = await screen.findByText('3 tasks shown');
    expect(subtitle).toBeInTheDocument();
  });
});
