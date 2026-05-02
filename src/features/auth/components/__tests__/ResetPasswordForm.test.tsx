import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ResetPasswordForm } from '../ResetPasswordForm';

function renderForm(overrides = {}) {
  const props = {
    onSubmit: vi.fn(),
    isPending: false,
    error: null,
    isSuccess: false,
    ...overrides,
  };
  return {
    ...render(
      <MemoryRouter>
        <ResetPasswordForm {...props} />
      </MemoryRouter>,
    ),
    props,
  };
}

describe('ResetPasswordForm', () => {
  it('renders password and confirm password inputs', () => {
    renderForm();

    expect(document.getElementById('password')).toBeInTheDocument();
    expect(document.getElementById('confirmPassword')).toBeInTheDocument();
  });

  it('calls onSubmit with matching passwords', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();

    await user.type(document.getElementById('password')!, 'newpass123');
    await user.type(document.getElementById('confirmPassword')!, 'newpass123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(props.onSubmit).toHaveBeenCalledWith({
      password: 'newpass123',
      confirmPassword: 'newpass123',
    });
  });

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();

    await user.type(document.getElementById('password')!, 'newpass123');
    await user.type(document.getElementById('confirmPassword')!, 'different');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows error message from props', () => {
    renderForm({ error: 'Token expired' });

    expect(screen.getByRole('alert')).toHaveTextContent('Token expired');
  });

  it('shows loading state when isPending is true', () => {
    renderForm({ isPending: true });

    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
  });

  it('shows success state with login link when isSuccess is true', () => {
    renderForm({ isSuccess: true });

    expect(
      screen.getByText(/password updated successfully/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/go to login/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /update password/i }),
    ).not.toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderForm();

    const passwordInput = document.getElementById('password')!;
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButtons = screen.getAllByRole('button', {
      name: /show password/i,
    });
    await user.click(toggleButtons[0]);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
