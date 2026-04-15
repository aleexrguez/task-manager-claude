import { NavLink } from 'react-router-dom';
import type { NavItem, SidebarProps } from './app-shell.types';

interface NavContentProps {
  navItems: NavItem[];
  collapsed: boolean;
  onSignOut: () => void;
  isSigningOut: boolean;
  onNavItemClick?: () => void;
}

function NavContent({
  navItems,
  collapsed,
  onSignOut,
  isSigningOut,
  onNavItemClick,
}: NavContentProps) {
  return (
    <>
      <ul className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavItemClick}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100',
                ].join(' ')
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          disabled={isSigningOut}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors w-full"
        >
          <span aria-hidden="true">exit</span>
          {!collapsed && (
            <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
          )}
        </button>
      </div>
    </>
  );
}

export function Sidebar({
  navItems,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onSignOut,
  isSigningOut,
}: SidebarProps) {
  const collapseLabel = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <>
      {/* Desktop sidebar — hidden on mobile, visible on md+ */}
      <aside
        className={[
          'hidden md:flex flex-col fixed top-0 left-0 h-full z-30 bg-white border-r border-gray-200 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-56',
        ].join(' ')}
      >
        <nav aria-label="Main navigation" className="flex flex-col flex-1 p-3">
          <NavContent
            navItems={navItems}
            collapsed={isCollapsed}
            onSignOut={onSignOut}
            isSigningOut={isSigningOut}
          />
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapseLabel}
            className="flex items-center justify-center w-full py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </aside>

      {/* Mobile overlay — only rendered when isMobileOpen is true */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="md:hidden fixed inset-0 z-40 flex"
        >
          {/* Semi-transparent backdrop — closes sidebar on click */}
          <div
            data-testid="mobile-backdrop"
            className="fixed inset-0 bg-black/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Mobile nav panel — always expanded (not collapsed) */}
          <div className="relative z-50 flex flex-col w-64 bg-white h-full shadow-xl">
            <nav
              aria-label="Mobile navigation"
              className="flex flex-col flex-1 p-3"
            >
              <NavContent
                navItems={navItems}
                collapsed={false}
                onSignOut={onSignOut}
                isSigningOut={isSigningOut}
                onNavItemClick={onCloseMobile}
              />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
