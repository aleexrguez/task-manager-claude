import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppPreferencesStore } from '@/shared/store/app-preferences.store';
import { useSignOut } from '@/features/auth/hooks';
import { useApplyTheme } from '@/shared/hooks/use-apply-theme';
import { useTasks } from '@/features/task-manager/hooks/use-tasks';
import { useRecurrences } from '@/features/recurrences/hooks/use-recurrences';
import { useAutoGenerate } from '@/features/recurrences/hooks/use-auto-generate';
import { AppShellLayout } from './AppShellLayout';
import { ReminderContainerCtrl } from '@/features/task-manager/containers';
import type { NavItem } from './app-shell.types';

const NAV_ITEMS: NavItem[] = [
  { label: 'Tasks', to: '/app/tasks', icon: '/TaskIcon.png' },
  { label: 'Recurrences', to: '/app/recurrences', icon: '/RecurrenceIcon.png' },
  { label: 'Settings', to: '/app/settings', icon: '/SettingsIcon.png' },
];

export function AppShellContainer() {
  useApplyTheme();

  const { data: tasksData } = useTasks();
  const { data: recurrencesData } = useRecurrences();
  useAutoGenerate(recurrencesData?.recurrences ?? [], tasksData?.tasks ?? []);

  const isSidebarCollapsed = useAppPreferencesStore(
    (s) => s.isSidebarCollapsed,
  );
  const toggleSidebar = useAppPreferencesStore((s) => s.toggleSidebar);

  const { signOut, isPending: isSigningOut } = useSignOut();

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    queryClient.clear();
    navigate('/');
  }

  return (
    <>
      <AppShellLayout
        headerProps={{
          appName: 'TaskOps',
          isCollapsed: isSidebarCollapsed,
          onToggleMobileSidebar: () => setIsMobileSidebarOpen(true),
        }}
        sidebarProps={{
          navItems: NAV_ITEMS,
          isCollapsed: isSidebarCollapsed,
          onToggleCollapse: toggleSidebar,
          isMobileOpen: isMobileSidebarOpen,
          onCloseMobile: () => setIsMobileSidebarOpen(false),
          onSignOut: handleSignOut,
          isSigningOut,
        }}
      />
      <ReminderContainerCtrl tasks={tasksData?.tasks ?? []} />
    </>
  );
}
