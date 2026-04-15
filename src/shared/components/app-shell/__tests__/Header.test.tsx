import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Header } from '../Header';

describe('Header', () => {
  it('renders the app name', () => {
    render(<Header appName="Task Manager" onToggleMobileSidebar={vi.fn()} />);

    expect(screen.getByText('Task Manager')).toBeInTheDocument();
  });

  it('renders a hamburger button with correct aria-label', () => {
    render(<Header appName="Task Manager" onToggleMobileSidebar={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Open menu' }),
    ).toBeInTheDocument();
  });

  it('calls onToggleMobileSidebar when hamburger button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleMobileSidebar = vi.fn();

    render(
      <Header
        appName="Task Manager"
        onToggleMobileSidebar={onToggleMobileSidebar}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(onToggleMobileSidebar).toHaveBeenCalledOnce();
  });

  it('hamburger button has md:hidden class so it is only visible on mobile', () => {
    render(<Header appName="Task Manager" onToggleMobileSidebar={vi.fn()} />);

    const hamburgerButton = screen.getByRole('button', { name: 'Open menu' });

    expect(hamburgerButton).toHaveClass('md:hidden');
  });
});
