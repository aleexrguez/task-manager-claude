import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EditRecurrenceContainer } from '../EditRecurrenceContainer';
import { useRecurrenceUIStore } from '../../store/recurrence-ui.store';
import type { RecurrenceTemplate } from '../../types/recurrence.types';

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
  useRecurrence: vi.fn(),
  useUpdateRecurrence: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

import { useRecurrence } from '../../hooks/use-recurrences';

function makeTemplate(overrides: Partial<RecurrenceTemplate> = {}): RecurrenceTemplate {
  return {
    id: 'template-1',
    title: 'Morning exercise',
    priority: 'medium',
    frequency: 'daily',
    isActive: true,
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

describe('EditRecurrenceContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRecurrenceUIStore.setState({
      isCreateModalOpen: false,
      isEditModalOpen: false,
      selectedTemplateId: null,
    });
    (useRecurrence as ReturnType<typeof vi.fn>).mockReturnValue({
      data: makeTemplate(),
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it('does not render form when modal is closed', () => {
    const Wrapper = createWrapper();
    render(<EditRecurrenceContainer />, { wrapper: Wrapper });

    expect(screen.queryByRole('heading', { name: /edit recurrence/i })).not.toBeInTheDocument();
  });

  it('does not render form when modal is open but no template is selected', () => {
    useRecurrenceUIStore.setState({ isEditModalOpen: true, selectedTemplateId: null });
    const Wrapper = createWrapper();
    render(<EditRecurrenceContainer />, { wrapper: Wrapper });

    expect(screen.queryByRole('heading', { name: /edit recurrence/i })).not.toBeInTheDocument();
  });

  it('renders form when modal is open and template is selected', () => {
    useRecurrenceUIStore.setState({
      isEditModalOpen: true,
      selectedTemplateId: 'template-1',
    });
    const Wrapper = createWrapper();
    render(<EditRecurrenceContainer />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { name: /edit recurrence/i })).toBeInTheDocument();
  });

  it('shows loading spinner while fetching template', () => {
    (useRecurrence as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    useRecurrenceUIStore.setState({
      isEditModalOpen: true,
      selectedTemplateId: 'template-1',
    });
    const Wrapper = createWrapper();
    render(<EditRecurrenceContainer />, { wrapper: Wrapper });

    // Loading spinner should be visible instead of form
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it('pre-populates form with template title', () => {
    (useRecurrence as ReturnType<typeof vi.fn>).mockReturnValue({
      data: makeTemplate({ title: 'Morning exercise' }),
      isLoading: false,
      isError: false,
      error: null,
    });
    useRecurrenceUIStore.setState({
      isEditModalOpen: true,
      selectedTemplateId: 'template-1',
    });
    const Wrapper = createWrapper();
    render(<EditRecurrenceContainer />, { wrapper: Wrapper });

    expect(screen.getByDisplayValue('Morning exercise')).toBeInTheDocument();
  });

  it('calls updateRecurrence with id and input on submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    useRecurrenceUIStore.setState({
      isEditModalOpen: true,
      selectedTemplateId: 'template-1',
    });
    const Wrapper = createWrapper();
    render(<EditRecurrenceContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'template-1', input: expect.any(Object) }),
    );
  });

  it('closes modal on successful update', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    useRecurrenceUIStore.setState({
      isEditModalOpen: true,
      selectedTemplateId: 'template-1',
    });
    const Wrapper = createWrapper();
    render(<EditRecurrenceContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(useRecurrenceUIStore.getState().isEditModalOpen).toBe(false);
  });

  it('shows success toast on successful update', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    useRecurrenceUIStore.setState({
      isEditModalOpen: true,
      selectedTemplateId: 'template-1',
    });
    const Wrapper = createWrapper();
    render(<EditRecurrenceContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('shows error toast when update fails', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Network error'));
    useRecurrenceUIStore.setState({
      isEditModalOpen: true,
      selectedTemplateId: 'template-1',
    });
    const Wrapper = createWrapper();
    render(<EditRecurrenceContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    useRecurrenceUIStore.setState({
      isEditModalOpen: true,
      selectedTemplateId: 'template-1',
    });
    const Wrapper = createWrapper();
    render(<EditRecurrenceContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(useRecurrenceUIStore.getState().isEditModalOpen).toBe(false);
  });
});
