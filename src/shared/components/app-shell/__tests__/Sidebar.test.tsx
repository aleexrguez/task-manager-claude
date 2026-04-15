import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import type { NavItem, SidebarProps } from '../app-shell.types';

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
  { label: 'Tasks', to: '/tasks', icon: 'tasks' },
];

const defaultProps: SidebarProps = {
  navItems,
  isCollapsed: false,
  onToggleCollapse: vi.fn(),
  isMobileOpen: false,
  onCloseMobile: vi.fn(),
  onSignOut: vi.fn(),
  isSigningOut: false,
};

function renderSidebar(props: Partial<SidebarProps> = {}) {
  return render(
    <MemoryRouter>
      <Sidebar {...defaultProps} {...props} />
    </MemoryRouter>,
  );
}

describe('Sidebar — nav items', () => {
  it('renders all nav items as links', () => {
    renderSidebar();

    expect(
      screen.getByRole('link', { name: /dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /tasks/i })).toBeInTheDocument();
  });
});

describe('Sidebar — sign out', () => {
  it('renders sign out button', () => {
    renderSidebar();

    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it('calls onSignOut when sign out button is clicked', async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();

    renderSidebar({ onSignOut });

    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('shows "Signing out..." text when isSigningOut is true', () => {
    renderSidebar({ isSigningOut: true });

    expect(screen.getByText(/signing out/i)).toBeInTheDocument();
  });
});

describe('Sidebar — collapse toggle', () => {
  it('calls onToggleCollapse when collapse button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleCollapse = vi.fn();

    renderSidebar({ onToggleCollapse });

    await user.click(screen.getByRole('button', { name: /collapse sidebar/i }));

    expect(onToggleCollapse).toHaveBeenCalledOnce();
  });

  it('collapse button has aria-label "Collapse sidebar" when expanded', () => {
    renderSidebar({ isCollapsed: false });

    expect(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    ).toBeInTheDocument();
  });

  it('collapse button has aria-label "Expand sidebar" when collapsed', () => {
    renderSidebar({ isCollapsed: true });

    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toBeInTheDocument();
  });

  it('hides nav item labels when sidebar is collapsed', () => {
    renderSidebar({ isCollapsed: true });

    // Labels must exist but be visually hidden — we check for sr-only or hidden class
    // The desktop nav wraps labels in a span; when collapsed, labels are not rendered
    const desktopNav = screen.getByRole('navigation', {
      name: 'Main navigation',
    });

    expect(desktopNav).not.toHaveTextContent('Dashboard');
    expect(desktopNav).not.toHaveTextContent('Tasks');
  });
});

describe('Sidebar — mobile overlay', () => {
  it('renders mobile overlay when isMobileOpen is true', () => {
    renderSidebar({ isMobileOpen: true });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render mobile overlay when isMobileOpen is false', () => {
    renderSidebar({ isMobileOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onCloseMobile when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onCloseMobile = vi.fn();

    renderSidebar({ isMobileOpen: true, onCloseMobile });

    await user.click(screen.getByTestId('mobile-backdrop'));

    expect(onCloseMobile).toHaveBeenCalledOnce();
  });
});
