import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShellContainer } from '../AppShellContainer';
import { useAppPreferencesStore } from '@/shared/store/app-preferences.store';
import { useSignOut } from '@/features/auth/hooks';
import { useApplyTheme } from '@/shared/hooks/use-apply-theme';
import { useQueryClient } from '@tanstack/react-query';

vi.mock('@/shared/store/app-preferences.store', () => ({
  useAppPreferencesStore: vi.fn(),
}));

vi.mock('@/features/auth/hooks', () => ({
  useSignOut: vi.fn(),
}));

vi.mock('@/shared/hooks/use-apply-theme', () => ({
  useApplyTheme: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}));

vi.mock('@/features/task-manager/hooks/use-tasks', () => ({
  useTasks: () => ({ data: { tasks: [], total: 0 }, isLoading: false }),
}));

vi.mock('@/features/recurrences/hooks/use-recurrences', () => ({
  useRecurrences: () => ({
    data: { recurrences: [], total: 0 },
    isLoading: false,
  }),
}));

vi.mock('@/features/recurrences/hooks/use-auto-generate', () => ({
  useAutoGenerate: vi.fn(),
}));

vi.mock('@/features/task-manager/store/reminder.store', () => ({
  useReminderStore: vi.fn((selector) =>
    selector({
      dismissedTaskIds: new Set(),
      dismiss: vi.fn(),
      clearDismissed: vi.fn(),
    }),
  ),
}));

vi.mock('@/features/task-manager/hooks/use-due-reminders', () => ({
  useDueReminders: () => [],
}));

const mockToggleSidebar = vi.fn();
const mockSignOut = vi.fn();
const mockClearQueryClient = vi.fn();

function renderContainer(initialEntry = '/app') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app" element={<AppShellContainer />}>
          <Route index element={<Navigate to="tasks" replace />} />
          <Route path="tasks" element={<div>Tasks Page</div>} />
          <Route path="recurrences" element={<div>Recurrences Page</div>} />
          <Route path="settings" element={<div>Settings Page</div>} />
        </Route>
        <Route path="/" element={<div>Landing Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(useAppPreferencesStore).mockImplementation((selector) =>
    selector({
      isSidebarCollapsed: false,
      toggleSidebar: mockToggleSidebar,
      theme: 'system',
      setTheme: vi.fn(),
      retentionPolicy: 'never',
      setRetentionPolicy: vi.fn(),
      remindersEnabled: true,
      toggleReminders: vi.fn(),
    }),
  );

  vi.mocked(useSignOut).mockReturnValue({
    signOut: mockSignOut,
    isPending: false,
  });

  vi.mocked(useApplyTheme).mockReturnValue(undefined);

  vi.mocked(useQueryClient).mockReturnValue({
    clear: mockClearQueryClient,
  } as unknown as ReturnType<typeof useQueryClient>);
});

describe('AppShellContainer — theme', () => {
  it('calls useApplyTheme on mount', () => {
    renderContainer();

    expect(useApplyTheme).toHaveBeenCalled();
  });
});

describe('AppShellContainer — nav items', () => {
  it('renders all nav items', () => {
    renderContainer();

    expect(screen.getByRole('link', { name: /tasks/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /recurrences/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
  });
});

describe('AppShellContainer — sign out button', () => {
  it('renders sign out button in sidebar', () => {
    renderContainer();

    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument();
  });
});

describe('AppShellContainer — sign out action', () => {
  it('calls signOut, clears query client, and navigates to "/" when sign out is clicked', async () => {
    const user = userEvent.setup();

    mockSignOut.mockResolvedValue(undefined);

    renderContainer();

    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(mockClearQueryClient).toHaveBeenCalledOnce();
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
  });
});

describe('AppShellContainer — mobile sidebar', () => {
  it('toggles mobile sidebar open when hamburger button is clicked', async () => {
    const user = userEvent.setup();

    renderContainer();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('AppShellContainer — sidebar collapsed state', () => {
  it('passes isSidebarCollapsed=true from store to the layout', () => {
    vi.mocked(useAppPreferencesStore).mockImplementation((selector) =>
      selector({
        isSidebarCollapsed: true,
        toggleSidebar: mockToggleSidebar,
        theme: 'system',
        setTheme: vi.fn(),
        retentionPolicy: 'never',
        setRetentionPolicy: vi.fn(),
        remindersEnabled: true,
        toggleReminders: vi.fn(),
      }),
    );

    renderContainer();

    // When collapsed, the main element uses md:ml-16 (verified via AppShellLayout internals)
    expect(screen.getByRole('main')).toHaveClass('md:ml-16');
  });
});
