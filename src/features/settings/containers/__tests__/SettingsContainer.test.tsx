import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useAppPreferencesStore } from '@/shared/store/app-preferences.store';
import { useAuth, useSignOut } from '@/features/auth/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { SettingsContainer } from '../SettingsContainer';

vi.mock('@/shared/store/app-preferences.store', () => ({
  useAppPreferencesStore: vi.fn(),
}));

vi.mock('@/features/auth/hooks', () => ({
  useAuth: vi.fn(),
  useSignOut: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}));

const mockSetTheme = vi.fn();
const mockSetRetentionPolicy = vi.fn();
const mockToggleReminders = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockClear = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSignOut.mockResolvedValue(undefined);

  vi.mocked(useAppPreferencesStore).mockImplementation((selector) =>
    selector({
      theme: 'system',
      setTheme: mockSetTheme,
      retentionPolicy: 'never',
      setRetentionPolicy: mockSetRetentionPolicy,
      isSidebarCollapsed: false,
      toggleSidebar: vi.fn(),
      remindersEnabled: true,
      toggleReminders: mockToggleReminders,
    }),
  );

  vi.mocked(useAuth).mockReturnValue({
    user: {
      email: 'user@example.com',
    } as unknown as import('@supabase/supabase-js').User,
    session: null,
    isLoading: false,
  });

  vi.mocked(useSignOut).mockReturnValue({
    signOut: mockSignOut,
    isPending: false,
  });

  vi.mocked(useQueryClient).mockReturnValue({
    clear: mockClear,
  } as unknown as ReturnType<typeof useQueryClient>);
});

function renderContainer() {
  return render(
    <MemoryRouter>
      <SettingsContainer />
    </MemoryRouter>,
  );
}

describe('SettingsContainer', () => {
  it('renders the Settings page heading', () => {
    renderContainer();

    expect(
      screen.getByRole('heading', { level: 1, name: /settings/i }),
    ).toBeInTheDocument();
  });

  it('renders the user email from auth context', () => {
    renderContainer();

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('renders theme radios from store state', () => {
    renderContainer();

    expect(screen.getByRole('radio', { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /system/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /system/i })).toBeChecked();
  });

  it('calls setTheme when a theme radio is clicked', async () => {
    const user = userEvent.setup();
    renderContainer();

    await user.click(screen.getByRole('radio', { name: /dark/i }));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('renders retention select with store value', () => {
    renderContainer();

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('never');
  });

  it('calls setRetentionPolicy when retention is changed', async () => {
    const user = userEvent.setup();
    renderContainer();

    await user.selectOptions(screen.getByRole('combobox'), '7d');

    expect(mockSetRetentionPolicy).toHaveBeenCalledWith('7d');
  });

  it('calls signOut, clears query client, and navigates to "/" on sign out', async () => {
    const user = userEvent.setup();
    renderContainer();

    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(mockClear).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders reminders checkbox checked when store has remindersEnabled=true', () => {
    renderContainer();

    expect(
      screen.getByRole('checkbox', { name: /due date reminders/i }),
    ).toBeChecked();
  });

  it('calls toggleReminders from store when checkbox is clicked', async () => {
    const user = userEvent.setup();
    renderContainer();

    await user.click(
      screen.getByRole('checkbox', { name: /due date reminders/i }),
    );

    expect(mockToggleReminders).toHaveBeenCalledOnce();
  });
});
