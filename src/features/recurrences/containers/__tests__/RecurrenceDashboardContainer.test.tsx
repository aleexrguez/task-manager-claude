import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RecurrenceDashboardContainer } from '../RecurrenceDashboardContainer';
import { useRecurrenceUIStore } from '../../store/recurrence-ui.store';
import type { RecurrenceTemplate } from '../../types/recurrence.types';

// Mock child modals — they have their own tests
vi.mock('../CreateRecurrenceContainer', () => ({
  CreateRecurrenceContainer: () => null,
}));
vi.mock('../EditRecurrenceContainer', () => ({
  EditRecurrenceContainer: () => null,
}));

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
  useToastStore: vi.fn(
    (selector: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown) =>
      selector({ addToast: mockAddToast }),
  ),
}));

const mockAddToast = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('../../hooks/use-recurrences', () => ({
  useRecurrences: vi.fn(),
  useDeleteRecurrence: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
    variables: undefined,
  }),
}));

import { useRecurrences } from '../../hooks/use-recurrences';

function makeTemplate(
  overrides: Partial<RecurrenceTemplate> = {},
): RecurrenceTemplate {
  return {
    id: crypto.randomUUID(),
    title: 'Morning exercise',
    priority: 'medium',
    frequency: 'daily',
    leadTimeDays: 0,
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

describe('RecurrenceDashboardContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRecurrenceUIStore.setState({
      isCreateModalOpen: false,
      isEditModalOpen: false,
      selectedTemplateId: null,
    });
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { recurrences: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders page heading with "Recurrences" title', () => {
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    expect(
      screen.getByRole('heading', { name: /recurrences/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders "New Recurrence" button', () => {
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    expect(
      screen.getByRole('button', { name: /new recurrence/i }),
    ).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    // Loading indicator should be present
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', () => {
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    });
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it('calls refetch when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn();
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    });
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it('renders RecurrenceList with templates when loaded', () => {
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        recurrences: [
          makeTemplate({ id: 'tmpl-1', title: 'Morning run' }),
          makeTemplate({ id: 'tmpl-2', title: 'Evening reading' }),
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    expect(screen.getByText('Morning run')).toBeInTheDocument();
    expect(screen.getByText('Evening reading')).toBeInTheDocument();
  });

  it('renders a "Daily" section heading when there are daily templates', () => {
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        recurrences: [
          makeTemplate({
            id: 'tmpl-1',
            title: 'Morning run',
            frequency: 'daily',
          }),
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    expect(
      screen.getByRole('heading', { name: /daily/i, level: 2 }),
    ).toBeInTheDocument();
  });

  it('groups templates by frequency — shows "Weekly" and "Monthly" headings for mixed templates', () => {
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        recurrences: [
          makeTemplate({
            id: 'tmpl-1',
            title: 'Weekly review',
            frequency: 'weekly',
            weeklyDays: [1],
          }),
          makeTemplate({
            id: 'tmpl-2',
            title: 'Pay bills',
            frequency: 'monthly',
            monthlyDay: 1,
          }),
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    expect(
      screen.getByRole('heading', { name: /weekly/i, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /monthly/i, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /daily/i, level: 2 }),
    ).not.toBeInTheDocument();
  });

  it('opens create modal when "New Recurrence" button is clicked', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /new recurrence/i }));

    expect(useRecurrenceUIStore.getState().isCreateModalOpen).toBe(true);
  });

  it('opens edit modal with template id when edit is triggered on a card', async () => {
    const user = userEvent.setup();
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        recurrences: [makeTemplate({ id: 'tmpl-1', title: 'Morning run' })],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(useRecurrenceUIStore.getState().isEditModalOpen).toBe(true);
    expect(useRecurrenceUIStore.getState().selectedTemplateId).toBe('tmpl-1');
  });

  it('shows delete confirmation dialog when delete is triggered on a card', async () => {
    const user = userEvent.setup();
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        recurrences: [makeTemplate({ id: 'tmpl-1', title: 'Morning run' })],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /delete recurrence/i }),
    ).toBeInTheDocument();
  });

  it('calls deleteRecurrence mutation when confirm delete is clicked', async () => {
    const user = userEvent.setup();
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        recurrences: [makeTemplate({ id: 'tmpl-1', title: 'Morning run' })],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    // Click the confirm Delete button inside the dialog (not the card's Delete button)
    const dialog = screen.getByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', {
      name: /^delete$/i,
    });
    await user.click(confirmButton);

    expect(mockDeleteMutate).toHaveBeenCalledWith('tmpl-1', expect.any(Object));
  });

  it('cancels deletion dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    (useRecurrences as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        recurrences: [makeTemplate({ id: 'tmpl-1', title: 'Morning run' })],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it('shows empty state when no templates exist', () => {
    const Wrapper = createWrapper();
    render(<RecurrenceDashboardContainer />, { wrapper: Wrapper });

    expect(screen.getByText(/no recurrences/i)).toBeInTheDocument();
  });
});
