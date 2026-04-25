import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, type MockedFunction } from 'vitest';
import { useToastStore } from '../../store/toast.store';
import type { Task } from '../../types';
import { TaskDetailContainer } from '../TaskDetailContainer';

vi.mock('@/features/auth/hooks', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    session: null,
    isLoading: false,
  }),
}));

vi.mock('@/features/task-manager/api', () => ({
  fetchTasks: vi.fn(),
  fetchTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock('@/features/recurrences/hooks/use-recurrences', () => ({
  useRecurrence: vi.fn(() => ({ data: undefined })),
}));

vi.mock('@/features/recurrences/utils/recurrence.utils', () => ({
  isGeneratedTask: vi.fn(() => false),
  formatFrequencyLabel: vi.fn(() => ''),
}));

vi.mock('@/features/recurrences/api/recurrence-api', () => ({
  fetchRecurrences: vi.fn(),
  fetchRecurrenceById: vi.fn(),
  createRecurrence: vi.fn(),
  updateRecurrence: vi.fn(),
  deleteRecurrence: vi.fn(),
}));

import {
  fetchTaskById,
  deleteTask,
  updateTask,
} from '@/features/task-manager/api';

const mockFetchTaskById = fetchTaskById as MockedFunction<typeof fetchTaskById>;
const mockDeleteTask = deleteTask as MockedFunction<typeof deleteTask>;
const mockUpdateTask = updateTask as MockedFunction<typeof updateTask>;

const mockTask: Task = {
  id: 'task-uuid-001',
  title: 'Fix login bug',
  description: 'Users cannot log in with email containing plus signs',
  status: 'in-progress',
  priority: 'high',
  createdAt: '2026-03-15T10:00:00.000Z',
  updatedAt: '2026-03-20T15:30:00.000Z',
  position: 0,
  isArchived: false,
};

function renderWithProviders(taskId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/app/tasks/${taskId}`]}>
        <Routes>
          <Route path="/app/tasks/:id" element={<TaskDetailContainer />} />
          <Route path="/app" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TaskDetailContainer', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.clearAllMocks();
  });

  it('shows loading skeleton while task is being fetched', () => {
    mockFetchTaskById.mockReturnValue(new Promise(() => {}));

    renderWithProviders('task-uuid-001');

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders TaskDetailView with task data on success', async () => {
    mockFetchTaskById.mockResolvedValue(mockTask);

    renderWithProviders('task-uuid-001');

    expect(
      await screen.findByRole('heading', { name: 'Fix login bug' }),
    ).toBeInTheDocument();
  });

  it('shows TaskNotFound when task does not exist', async () => {
    mockFetchTaskById.mockRejectedValue(
      new Error('Task not found: task-uuid-999'),
    );

    renderWithProviders('task-uuid-999');

    expect(await screen.findByText(/task not found/i)).toBeInTheDocument();
  });

  it('shows TaskErrorState for other errors', async () => {
    mockFetchTaskById.mockRejectedValue(new Error('Network error'));

    renderWithProviders('task-uuid-001');

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked on error state', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockRejectedValue(new Error('Network error'));

    renderWithProviders('task-uuid-001');

    await screen.findByText('Network error');

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(mockFetchTaskById).toHaveBeenCalledTimes(2);
  });

  it('activates inline editing when Edit button is clicked', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);

    renderWithProviders('task-uuid-001');
    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    // Should show form fields inline, not modal
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    // Heading should be gone (replaced by form)
    expect(
      screen.queryByRole('heading', { name: 'Fix login bug' }),
    ).not.toBeInTheDocument();
  });

  it('returns to view mode when Cancel is clicked', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);

    renderWithProviders('task-uuid-001');
    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(
      screen.getByRole('heading', { name: 'Fix login bug' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it('calls updateTask and returns to view mode on successful save', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);
    mockUpdateTask.mockResolvedValue(mockTask);

    renderWithProviders('task-uuid-001');
    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalled();
    });
    // After success, should return to view mode
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Fix login bug' }),
      ).toBeInTheDocument();
    });
  });

  it('shows success toast after saving', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);
    mockUpdateTask.mockResolvedValue(mockTask);

    renderWithProviders('task-uuid-001');
    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      const { toasts } = useToastStore.getState();
      expect(
        toasts.some(
          (t) => t.type === 'success' && t.message === 'Task updated',
        ),
      ).toBe(true);
    });
  });

  it('shows error toast when save fails', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);
    mockUpdateTask.mockRejectedValue(new Error('Update failed'));

    renderWithProviders('task-uuid-001');
    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      const { toasts } = useToastStore.getState();
      expect(toasts.some((t) => t.type === 'error')).toBe(true);
    });
  });

  it('does not open modal when Edit is clicked (no EditTaskContainer)', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);

    renderWithProviders('task-uuid-001');
    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    // No modal overlay should exist
    expect(document.querySelector('.fixed.inset-0')).not.toBeInTheDocument();
  });

  it('shows confirm dialog when Delete button is clicked', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);

    renderWithProviders('task-uuid-001');

    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(
      screen.getByRole('heading', { name: /delete task/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('deletes task and navigates to dashboard on confirm', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);
    mockDeleteTask.mockResolvedValue(undefined);

    renderWithProviders('task-uuid-001');

    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(mockDeleteTask).toHaveBeenCalledWith('task-uuid-001');
  });

  it('shows success toast on successful delete', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);
    mockDeleteTask.mockResolvedValue(undefined);

    renderWithProviders('task-uuid-001');

    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
    });
  });

  it('shows error toast when delete fails', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);
    mockDeleteTask.mockRejectedValue(new Error('Failed to delete'));

    renderWithProviders('task-uuid-001');

    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
    });
  });

  it('deletes a recurring task from detail and navigates to dashboard', async () => {
    const { isGeneratedTask } =
      await import('@/features/recurrences/utils/recurrence.utils');
    vi.mocked(isGeneratedTask).mockReturnValue(true);

    const user = userEvent.setup();
    const recurringTask = {
      ...mockTask,
      recurrenceTemplateId: 'tpl-1',
      recurrenceDateKey: '2026-04-25',
    };
    mockFetchTaskById.mockResolvedValue(recurringTask);
    mockDeleteTask.mockResolvedValue(undefined);

    renderWithProviders('task-uuid-001');

    await screen.findByText('Recurring');

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(mockDeleteTask).toHaveBeenCalledWith('task-uuid-001');
  });

  it('shows Recurring badge for a generated task', async () => {
    const { isGeneratedTask } =
      await import('@/features/recurrences/utils/recurrence.utils');
    vi.mocked(isGeneratedTask).mockReturnValue(true);

    const recurringTask = {
      ...mockTask,
      recurrenceTemplateId: 'tpl-1',
      recurrenceDateKey: '2026-04-25',
    };
    mockFetchTaskById.mockResolvedValue(recurringTask);

    renderWithProviders('task-uuid-001');

    expect(await screen.findByText('Recurring')).toBeInTheDocument();
  });

  it('shows frequency label when recurrence template is loaded', async () => {
    const { isGeneratedTask, formatFrequencyLabel } =
      await import('@/features/recurrences/utils/recurrence.utils');
    const { useRecurrence } =
      await import('@/features/recurrences/hooks/use-recurrences');
    vi.mocked(isGeneratedTask).mockReturnValue(true);
    vi.mocked(formatFrequencyLabel).mockReturnValue('Weekly (Mon, Wed)');
    vi.mocked(useRecurrence).mockReturnValue({
      data: { id: 'tpl-1', frequency: 'weekly', weeklyDays: [1, 3] },
    } as ReturnType<typeof useRecurrence>);

    const recurringTask = {
      ...mockTask,
      recurrenceTemplateId: 'tpl-1',
      recurrenceDateKey: '2026-04-25',
    };
    mockFetchTaskById.mockResolvedValue(recurringTask);

    renderWithProviders('task-uuid-001');

    expect(await screen.findByText('Weekly (Mon, Wed)')).toBeInTheDocument();
  });
});
