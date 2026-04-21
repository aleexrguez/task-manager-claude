import { useAppPreferencesStore } from '../app-preferences.store';

const THEME_KEY = 'task-manager-theme';
const RETENTION_KEY = 'task-manager-retention-policy';
const SIDEBAR_KEY = 'task-manager-sidebar-collapsed';
const REMINDERS_KEY = 'task-manager-reminders-enabled';

describe('useAppPreferencesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppPreferencesStore.setState({
      theme: 'system',
      retentionPolicy: 'never',
      isSidebarCollapsed: false,
      remindersEnabled: true,
    });
  });

  // ─── theme ──────────────────────────────────────────────────────────────

  describe('theme', () => {
    it('defaults to "system"', () => {
      expect(useAppPreferencesStore.getState().theme).toBe('system');
    });

    it('setTheme("dark") changes theme to "dark"', () => {
      useAppPreferencesStore.getState().setTheme('dark');
      expect(useAppPreferencesStore.getState().theme).toBe('dark');
    });

    it('setTheme("light") changes theme to "light"', () => {
      useAppPreferencesStore.getState().setTheme('light');
      expect(useAppPreferencesStore.getState().theme).toBe('light');
    });

    it('setTheme("system") changes theme to "system"', () => {
      useAppPreferencesStore.getState().setTheme('dark');
      useAppPreferencesStore.getState().setTheme('system');
      expect(useAppPreferencesStore.getState().theme).toBe('system');
    });

    it('persists theme to localStorage on change', () => {
      useAppPreferencesStore.getState().setTheme('dark');
      expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    });

    it('reads initial theme from localStorage if available', () => {
      localStorage.setItem(THEME_KEY, 'dark');
      useAppPreferencesStore.setState({
        theme: localStorage.getItem(THEME_KEY) as 'light' | 'dark' | 'system',
      });
      expect(useAppPreferencesStore.getState().theme).toBe('dark');
    });
  });

  // ─── retentionPolicy ───────────────────────────────────────────────────

  describe('retentionPolicy', () => {
    it('defaults to "never"', () => {
      expect(useAppPreferencesStore.getState().retentionPolicy).toBe('never');
    });

    it('setRetentionPolicy("7d") changes retentionPolicy to "7d"', () => {
      useAppPreferencesStore.getState().setRetentionPolicy('7d');
      expect(useAppPreferencesStore.getState().retentionPolicy).toBe('7d');
    });

    it('persists retentionPolicy to localStorage on change', () => {
      useAppPreferencesStore.getState().setRetentionPolicy('30d');
      expect(localStorage.getItem(RETENTION_KEY)).toBe('30d');
    });
  });

  // ─── isSidebarCollapsed ─────────────────────────────────────────────────

  describe('isSidebarCollapsed', () => {
    it('defaults to false', () => {
      expect(useAppPreferencesStore.getState().isSidebarCollapsed).toBe(false);
    });

    it('toggleSidebar() flips to true', () => {
      useAppPreferencesStore.getState().toggleSidebar();
      expect(useAppPreferencesStore.getState().isSidebarCollapsed).toBe(true);
    });

    it('toggleSidebar() called twice returns to false', () => {
      useAppPreferencesStore.getState().toggleSidebar();
      useAppPreferencesStore.getState().toggleSidebar();
      expect(useAppPreferencesStore.getState().isSidebarCollapsed).toBe(false);
    });

    it('persists sidebar state to localStorage', () => {
      useAppPreferencesStore.getState().toggleSidebar();
      expect(localStorage.getItem(SIDEBAR_KEY)).toBe('true');
    });
  });

  // ─── remindersEnabled ───────────────────────────────────────────────────

  describe('remindersEnabled', () => {
    it('defaults to true', () => {
      expect(useAppPreferencesStore.getState().remindersEnabled).toBe(true);
    });

    it('toggleReminders() flips to false', () => {
      useAppPreferencesStore.getState().toggleReminders();
      expect(useAppPreferencesStore.getState().remindersEnabled).toBe(false);
    });

    it('toggleReminders() called twice returns to true', () => {
      useAppPreferencesStore.getState().toggleReminders();
      useAppPreferencesStore.getState().toggleReminders();
      expect(useAppPreferencesStore.getState().remindersEnabled).toBe(true);
    });

    it('persists remindersEnabled to localStorage', () => {
      useAppPreferencesStore.getState().toggleReminders();
      expect(localStorage.getItem(REMINDERS_KEY)).toBe('false');
    });
  });
});
