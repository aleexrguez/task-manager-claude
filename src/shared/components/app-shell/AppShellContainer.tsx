import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppPreferencesStore } from '@/shared/store/app-preferences.store';
import { useSignOut } from '@/features/auth/hooks';
import { useApplyTheme } from '@/shared/hooks/use-apply-theme';
import { AppShellLayout } from './AppShellLayout';
import type { NavItem } from './app-shell.types';

const NAV_ITEMS: NavItem[] = [
  { label: 'Tasks', to: '/app/tasks', icon: '📋' },
  { label: 'Recurrences', to: '/app/recurrences', icon: '🔄' },
  { label: 'Settings', to: '/app/settings', icon: '⚙️' },
];

export function AppShellContainer() {
  useApplyTheme();

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
    <AppShellLayout
      headerProps={{
        appName: 'Task Manager',
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
  );
}
