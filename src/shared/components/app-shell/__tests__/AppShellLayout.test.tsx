import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppShellLayout } from '../AppShellLayout';
import type { AppShellLayoutProps } from '../app-shell.types';

const defaultNavItems = [
  { label: 'Tasks', to: '/app/tasks', icon: '📋' },
  { label: 'Recurrences', to: '/app/recurrences', icon: '🔄' },
  { label: 'Settings', to: '/app/settings', icon: '⚙️' },
];

const defaultProps: AppShellLayoutProps = {
  headerProps: {
    appName: 'Task Manager',
    onToggleMobileSidebar: vi.fn(),
  },
  sidebarProps: {
    navItems: defaultNavItems,
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    isMobileOpen: false,
    onCloseMobile: vi.fn(),
    onSignOut: vi.fn(),
    isSigningOut: false,
  },
};

function renderWithRouter(props: AppShellLayoutProps) {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route path="/app" element={<AppShellLayout {...props} />}>
          <Route index element={<div>Test Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppShellLayout — Header', () => {
  it('renders the Header component with the app name', () => {
    renderWithRouter(defaultProps);

    expect(screen.getByText('Task Manager')).toBeInTheDocument();
  });
});

describe('AppShellLayout — Sidebar', () => {
  it('renders the Sidebar component with nav items', () => {
    renderWithRouter(defaultProps);

    expect(screen.getByRole('link', { name: /tasks/i })).toBeInTheDocument();
  });
});

describe('AppShellLayout — Outlet', () => {
  it('renders child route content via Outlet', () => {
    renderWithRouter(defaultProps);

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

describe('AppShellLayout — main element margin', () => {
  it('applies md:ml-56 to main when sidebar is expanded', () => {
    renderWithRouter(defaultProps);

    const main = screen.getByRole('main');

    expect(main).toHaveClass('md:ml-56');
  });

  it('applies md:ml-16 to main when sidebar is collapsed', () => {
    renderWithRouter({
      ...defaultProps,
      sidebarProps: { ...defaultProps.sidebarProps, isCollapsed: true },
    });

    const main = screen.getByRole('main');

    expect(main).toHaveClass('md:ml-16');
  });
});
