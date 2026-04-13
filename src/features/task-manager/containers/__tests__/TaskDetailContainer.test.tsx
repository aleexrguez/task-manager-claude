import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, type MockedFunction } from 'vitest';
import { useTaskUIStore } from '../../store/task-ui.store';
import { useToastStore } from '../../store/toast.store';
import type { Task } from '../../types';
import { TaskDetailContainer } from '../TaskDetailContainer';

vi.mock('@/features/task-manager/api', () => ({
  fetchTasks: vi.fn(),
  fetchTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

import { fetchTaskById, deleteTask } from '@/features/task-manager/api';

const mockFetchTaskById = fetchTaskById as MockedFunction<typeof fetchTaskById>;
const mockDeleteTask = deleteTask as MockedFunction<typeof deleteTask>;

const mockTask: Task = {
  id: 'task-uuid-001',
  title: 'Fix login bug',
  description: 'Users cannot log in with email containing plus signs',
  status: 'in-progress',
  priority: 'high',
  createdAt: '2026-03-15T10:00:00.000Z',
  updatedAt: '2026-03-20T15:30:00.000Z',
};

function renderWithProviders(taskId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/tasks/${taskId}`]}>
        <Routes>
          <Route path="/tasks/:id" element={<TaskDetailContainer />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TaskDetailContainer', () => {
  beforeEach(() => {
    useTaskUIStore.setState({
      isEditModalOpen: false,
      selectedTaskId: null,
    });
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

  it('opens edit modal when Edit button is clicked', async () => {
    const user = userEvent.setup();
    mockFetchTaskById.mockResolvedValue(mockTask);

    renderWithProviders('task-uuid-001');

    await screen.findByRole('heading', { name: 'Fix login bug' });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    const { isEditModalOpen, selectedTaskId } = useTaskUIStore.getState();
    expect(isEditModalOpen).toBe(true);
    expect(selectedTaskId).toBe('task-uuid-001');
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
});
