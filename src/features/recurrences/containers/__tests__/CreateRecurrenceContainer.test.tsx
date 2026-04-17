import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CreateRecurrenceContainer } from '../CreateRecurrenceContainer';
import { useRecurrenceUIStore } from '../../store/recurrence-ui.store';

vi.mock('@/features/auth/hooks', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    session: null,
    isLoading: false,
  }),
}));

vi.mock('../../api/recurrence-api', () => ({
  fetchRecurrences: vi.fn(),
  fetchRecurrenceById: vi.fn(),
  createRecurrence: vi.fn(),
  updateRecurrence: vi.fn(),
  deleteRecurrence: vi.fn(),
  generateTasks: vi.fn(),
}));

vi.mock('@/features/task-manager/store/toast.store', () => ({
  useToastStore: vi.fn((selector: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ addToast: mockAddToast }),
  ),
}));

const mockAddToast = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('../../hooks/use-recurrences', () => ({
  useCreateRecurrence: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

import { createRecurrence } from '../../api/recurrence-api';

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

describe('CreateRecurrenceContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRecurrenceUIStore.setState({
      isCreateModalOpen: false,
      isEditModalOpen: false,
      selectedTemplateId: null,
    });
  });

  it('does not render form when modal is closed', () => {
    const Wrapper = createWrapper();
    render(<CreateRecurrenceContainer />, { wrapper: Wrapper });

    expect(screen.queryByRole('heading', { name: /new recurrence/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it('renders form when modal is open', () => {
    useRecurrenceUIStore.setState({ isCreateModalOpen: true });
    const Wrapper = createWrapper();
    render(<CreateRecurrenceContainer />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { name: /new recurrence/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it('renders close button when modal is open', () => {
    useRecurrenceUIStore.setState({ isCreateModalOpen: true });
    const Wrapper = createWrapper();
    render(<CreateRecurrenceContainer />, { wrapper: Wrapper });

    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    useRecurrenceUIStore.setState({ isCreateModalOpen: true });
    const Wrapper = createWrapper();
    render(<CreateRecurrenceContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(useRecurrenceUIStore.getState().isCreateModalOpen).toBe(false);
  });

  it('calls createRecurrence mutation on form submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    useRecurrenceUIStore.setState({ isCreateModalOpen: true });
    const Wrapper = createWrapper();
    render(<CreateRecurrenceContainer />, { wrapper: Wrapper });

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), 'Daily standup');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Daily standup', frequency: 'daily' }),
    );
  });

  it('closes modal on successful creation', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    useRecurrenceUIStore.setState({ isCreateModalOpen: true });
    const Wrapper = createWrapper();
    render(<CreateRecurrenceContainer />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/title/i), 'Daily standup');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(useRecurrenceUIStore.getState().isCreateModalOpen).toBe(false);
  });

  it('shows success toast on successful creation', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    useRecurrenceUIStore.setState({ isCreateModalOpen: true });
    const Wrapper = createWrapper();
    render(<CreateRecurrenceContainer />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/title/i), 'Daily standup');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('shows error toast when creation fails', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Network error'));
    useRecurrenceUIStore.setState({ isCreateModalOpen: true });
    const Wrapper = createWrapper();
    render(<CreateRecurrenceContainer />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/title/i), 'Daily standup');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('does not close modal when creation fails', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Network error'));
    useRecurrenceUIStore.setState({ isCreateModalOpen: true });
    const Wrapper = createWrapper();
    render(<CreateRecurrenceContainer />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/title/i), 'Daily standup');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(useRecurrenceUIStore.getState().isCreateModalOpen).toBe(true);
  });
});
