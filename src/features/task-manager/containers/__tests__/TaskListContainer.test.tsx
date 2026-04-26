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
  reorderTasks: vi.fn(),
}));

import {
  fetchTasks,
  reorderTasks,
  archiveTask,
  unarchiveTask,
} from '../../api';
import type { TaskBoard } from '../../utils';

// Capture onBoardChange prop passed to BoardView for direct invocation in tests
let capturedOnBoardChange: ((board: TaskBoard) => void) | undefined;
vi.mock('../../components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../components')>();
  return {
    ...actual,
    BoardView: (props: {
      onBoardChange?: (board: TaskBoard) => void;
      [key: string]: unknown;
    }) => {
      capturedOnBoardChange = props.onBoardChange;
      return actual.BoardView(
        props as unknown as Parameters<typeof actual.BoardView>[0],
      );
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
    position: 0,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('TaskListContainer — Block 1 features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnBoardChange = undefined;
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
        position: 0,
      }),
      makeTask({
        id: 'task-2',
        title: 'Low priority',
        priority: 'low',
        status: 'in-progress',
        position: 0,
      }),
      makeTask({
        id: 'task-3',
        title: 'Done task',
        status: 'done',
        priority: 'medium',
        position: 0,
        completedAt: '2026-01-09T10:00:00.000Z',
      }),
      makeTask({
        id: 'task-4',
        title: 'Archived done',
        status: 'done',
        priority: 'low',
        isArchived: true,
        position: 1,
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
    // TaskCard renders with data-task-id attribute
    const taskCards = document.querySelectorAll('[data-task-id]');
    expect(taskCards.length).toBeGreaterThan(0);
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

    const taskCards = document.querySelectorAll('[data-task-id]');
    const titles = Array.from(taskCards).map(
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
      .closest('[data-task-id]');
    expect(doneTaskCard).not.toBeNull();

    // Focus the card to make buttons visible
    await user.tab();

    // Use exact name 'Archive' to avoid matching 'Show archived' filter button
    const archiveButton = screen.getByRole('button', { name: 'Archive' });
    expect(archiveButton).toBeInTheDocument();
  });

  it('calls reorderTasks when onBoardChange is invoked with a board that differs from current state', async () => {
    useTaskUIStore.setState({ viewMode: 'board' });
    (reorderTasks as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    // Wait for board to render with tasks loaded
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
      expect(screen.getByText('High priority')).toBeInTheDocument();
    });

    // Simulate drag-end: task-1 moved from 'todo' to 'done'
    await act(async () => {
      capturedOnBoardChange?.({
        todo: [],
        'in-progress': [
          {
            id: 'task-2',
            title: 'Low priority',
            status: 'in-progress',
            priority: 'low',
            position: 0,
            isArchived: false,
            createdAt: '2026-01-10T10:00:00.000Z',
            updatedAt: '2026-01-10T10:00:00.000Z',
          },
        ],
        done: [
          {
            id: 'task-1',
            title: 'High priority',
            status: 'done',
            priority: 'high',
            position: 0,
            isArchived: false,
            createdAt: '2026-01-10T10:00:00.000Z',
            updatedAt: '2026-01-10T10:00:00.000Z',
          },
        ],
      });
    });

    await waitFor(() => {
      expect(reorderTasks).toHaveBeenCalled();
    });

    const callArgs = (reorderTasks as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    // task-1 moved to done column — must have status: 'done'
    expect(callArgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'task-1', status: 'done' }),
      ]),
    );
  });

  it('does not call reorderTasks when onBoardChange is invoked but nothing changed', async () => {
    useTaskUIStore.setState({ viewMode: 'board' });
    (reorderTasks as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('High priority')).toBeInTheDocument();
    });

    // Simulate drag-end with a board that exactly matches current cache
    await act(async () => {
      capturedOnBoardChange?.({
        todo: [
          {
            id: 'task-1',
            title: 'High priority',
            status: 'todo',
            priority: 'high',
            position: 0,
            isArchived: false,
            createdAt: '2026-01-10T10:00:00.000Z',
            updatedAt: '2026-01-10T10:00:00.000Z',
          },
        ],
        'in-progress': [
          {
            id: 'task-2',
            title: 'Low priority',
            status: 'in-progress',
            priority: 'low',
            position: 0,
            isArchived: false,
            createdAt: '2026-01-10T10:00:00.000Z',
            updatedAt: '2026-01-10T10:00:00.000Z',
          },
        ],
        done: [
          {
            id: 'task-3',
            title: 'Done task',
            status: 'done',
            priority: 'medium',
            position: 0,
            isArchived: false,
            createdAt: '2026-01-10T10:00:00.000Z',
            updatedAt: '2026-01-10T10:00:00.000Z',
          },
        ],
      });
    });

    expect(reorderTasks).not.toHaveBeenCalled();
  });

  it('calls archiveTask API when clicking Archive on a non-archived done task', async () => {
    const user = userEvent.setup();
    (archiveTask as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeTask({ id: 'task-3', isArchived: true }),
    );

    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Done task')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => {
      expect(archiveTask).toHaveBeenCalledWith('task-3');
    });
    expect(unarchiveTask).not.toHaveBeenCalled();
  });

  it('calls unarchiveTask API when clicking Unarchive on an archived task', async () => {
    const user = userEvent.setup();
    useTaskUIStore.setState({ showArchived: true });
    (unarchiveTask as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeTask({ id: 'task-4', isArchived: false }),
    );

    const Wrapper = createWrapper();
    render(<TaskListContainer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Archived done')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Unarchive' }));

    await waitFor(() => {
      expect(unarchiveTask).toHaveBeenCalledWith('task-4');
    });
    expect(archiveTask).not.toHaveBeenCalled();
  });
});
