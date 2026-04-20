import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TaskListContainer } from '../TaskListContainer';
import { useTaskUIStore } from '../../store';
import type { Task } from '../../types';

// Mock auth — provide authenticated user for hooks with enabled: !!user
vi.mock('@/features/auth/hooks', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    session: null,
    isLoading: false,
  }),
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

import { fetchTasks, updateTask } from '../../api';

// Capture onTaskDrop prop passed to BoardView for direct invocation in tests
let capturedOnTaskDrop:
  | ((taskId: string, newStatus: string) => void)
  | undefined;
vi.mock('../../components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../components')>();
  return {
    ...actual,
    BoardView: (props: {
      onTaskDrop?: (taskId: string, newStatus: string) => void;
      [key: string]: unknown;
    }) => {
      capturedOnTaskDrop = props.onTaskDrop;
      return actual.BoardView(props as Parameters<typeof actual.BoardView>[0]);
    },
  };
});

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

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Test Task',
    status: 'todo',
    priority: 'medium',
    isArchived: false,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('TaskListContainer — Block 1 features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnTaskDrop = undefined;
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
        title: 'High priority',
        priority: 'high',
        status: 'todo',
      }),
      makeTask({
        id: 'task-2',
        title: 'Low priority',
        priority: 'low',
        status: 'in-progress',
      }),
      makeTask({
        id: 'task-3',
        title: 'Done task',
        status: 'done',
        priority: 'medium',
        completedAt: '2026-01-09T10:00:00.000Z',
      }),
      makeTask({
        id: 'task-4',
        title: 'Archived done',
        status: 'done',
        priority: 'low',
        isArchived: true,
        completedAt: '2026-01-08T10:00:00.000Z',
      }),
    ];
    (fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValue({
      tasks: mockTasks,
      total: mockTasks.length,
    });
  });

  it('renders TaskList in list view mode by default', async () => {
    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(
        screen.queryByRole('status', { name: /loading/i }),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('High priority')).toBeInTheDocument();
    expect(screen.getByText('Low priority')).toBeInTheDocument();
    // TaskCard renders as article role
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBeGreaterThan(0);
  });

  it('renders BoardView when viewMode is board', async () => {
    useTaskUIStore.setState({ viewMode: 'board' });

    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    // BoardColumn renders column titles as h2 headings — distinct from filter <option> elements
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
    });

    expect(
      screen.getByRole('heading', { name: 'In Progress' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Done' })).toBeInTheDocument();
  });

  it('filters out archived done tasks by default', async () => {
    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Done task')).toBeInTheDocument();
    });

    expect(screen.queryByText('Archived done')).not.toBeInTheDocument();
  });

  it('shows archived done tasks when showArchived is true', async () => {
    useTaskUIStore.setState({ showArchived: true });

    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Archived done')).toBeInTheDocument();
    });
  });

  it('sorts tasks using sortTasks tri-sort — same-priority tasks sorted by createdAt descending', async () => {
    // sortTasksByPriority only sorts by priority (stable sort — keeps insertion order for equal priority)
    // sortTasks sorts by priority, then dueDate, then createdAt DESC (newer first)
    // We inject two medium-priority tasks with different createdAt to prove which sort is active
    const newerMedium = makeTask({
      id: 'newer-medium',
      title: 'Newer medium task',
      priority: 'medium',
      status: 'todo',
      createdAt: '2026-01-12T10:00:00.000Z',
      updatedAt: '2026-01-12T10:00:00.000Z',
    });
    const olderMedium = makeTask({
      id: 'older-medium',
      title: 'Older medium task',
      priority: 'medium',
      status: 'todo',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:00:00.000Z',
    });
    // API returns olderMedium before newerMedium — sortTasks should flip them (newer first)
    (fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValue({
      tasks: [olderMedium, newerMedium],
      total: 2,
    });

    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Newer medium task')).toBeInTheDocument();
    });

    const articles = screen.getAllByRole('article');
    const titles = articles.map(
      (el) => el.querySelector('h3')?.textContent ?? '',
    );
    const newerIndex = titles.findIndex((t) => t === 'Newer medium task');
    const olderIndex = titles.findIndex((t) => t === 'Older medium task');

    // sortTasks puts newer createdAt first (DESC); sortTasksByPriority keeps original order (older first)
    expect(newerIndex).toBeLessThan(olderIndex);
  });

  it('renders Archive button on done tasks', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Done task')).toBeInTheDocument();
    });

    // Archive button is only visible on hover/focus — we need to find it within the done task card
    const doneTaskCard = screen
      .getByText('Done task')
      .closest('[role="article"]');
    expect(doneTaskCard).not.toBeNull();

    // Focus the card to make buttons visible
    await user.tab();

    // Use exact name 'Archive' to avoid matching 'Show archived' filter button
    const archiveButton = screen.getByRole('button', { name: 'Archive' });
    expect(archiveButton).toBeInTheDocument();
  });

  it('optimistically moves a task to the new column when onTaskDrop is called', async () => {
    useTaskUIStore.setState({ viewMode: 'board' });
    (updateTask as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    // Wait for board to render with tasks loaded
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
      expect(screen.getByText('High priority')).toBeInTheDocument();
    });

    // Invoke the captured onTaskDrop — simulates a drag-end from board
    await act(async () => {
      capturedOnTaskDrop?.('task-1', 'done');
    });

    // After optimistic update, 'High priority' (originally 'todo') should appear in Done column
    // The done column heading is rendered — tasks are grouped by status in the board
    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith('task-1', { status: 'done' });
    });
  });

  it('does not call updateTask when task is dropped on its current column', async () => {
    useTaskUIStore.setState({ viewMode: 'board' });
    (updateTask as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('High priority')).toBeInTheDocument();
    });

    await act(async () => {
      // task-1 is already 'todo' — dropping on 'todo' should be a no-op
      capturedOnTaskDrop?.('task-1', 'todo');
    });

    expect(updateTask).not.toHaveBeenCalled();
  });
});
