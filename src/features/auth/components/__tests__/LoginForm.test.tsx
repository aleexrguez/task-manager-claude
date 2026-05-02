import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';

function renderLoginForm(props: Partial<Parameters<typeof LoginForm>[0]> = {}) {
  return render(
    <MemoryRouter>
      <LoginForm onSubmit={vi.fn()} isPending={false} error={null} {...props} />
    </MemoryRouter>,
  );
}

function getPasswordInput() {
  return document.getElementById('password') as HTMLInputElement;
}

describe('LoginForm — password visibility toggle', () => {
  it('renders password input with type="password" by default', () => {
    renderLoginForm();

    expect(getPasswordInput()).toHaveAttribute('type', 'password');
  });

  it('toggles password input to type="text" when show button is clicked', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole('button', { name: /show password/i }));

    expect(getPasswordInput()).toHaveAttribute('type', 'text');
  });

  it('toggles back to type="password" on second click', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(getPasswordInput()).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(getPasswordInput()).toHaveAttribute('type', 'password');
  });

  it('updates aria-label when toggled', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    await user.click(toggleBtn);

    expect(
      screen.getByRole('button', { name: /hide password/i }),
    ).toBeInTheDocument();
  });

  it('toggle button is keyboard operable', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    toggleBtn.focus();
    await user.keyboard('{Enter}');

    expect(getPasswordInput()).toHaveAttribute('type', 'text');
  });
});

describe('LoginForm — forgot password link', () => {
  it('renders a "Forgot password?" link pointing to /forgot-password', () => {
    renderLoginForm();

    const link = screen.getByText(/forgot password/i);
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/forgot-password');
  });
});
