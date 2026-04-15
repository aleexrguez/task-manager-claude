import type { HeaderProps } from './app-shell.types';

export function Header({ appName, onToggleMobileSidebar }: HeaderProps) {
  return (
    <header
      role="banner"
      className="fixed top-0 left-0 right-0 z-10 flex items-center border-b bg-white px-4 h-14 md:pl-56"
    >
      <button
        type="button"
        aria-label="Open menu"
        className="md:hidden mr-3"
        onClick={onToggleMobileSidebar}
      >
        <span aria-hidden="true">&#9776;</span>
      </button>

      <span className="font-semibold">{appName}</span>
    </header>
  );
}
