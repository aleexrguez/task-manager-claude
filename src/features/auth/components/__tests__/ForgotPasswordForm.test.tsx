import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ForgotPasswordForm } from '../ForgotPasswordForm';

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
        <ForgotPasswordForm {...props} />
      </MemoryRouter>,
    ),
    props,
  };
}

describe('ForgotPasswordForm', () => {
  it('renders email input and submit button', () => {
    renderForm();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send reset link/i }),
    ).toBeInTheDocument();
  });

  it('calls onSubmit with email on valid submission', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(props.onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('shows error message from props', () => {
    renderForm({ error: 'Something went wrong' });

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('shows loading state when isPending is true', () => {
    renderForm({ isPending: true });

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
  });

  it('shows success state when isSuccess is true', () => {
    renderForm({ isSuccess: true });

    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /send reset link/i }),
    ).not.toBeInTheDocument();
  });

  it('shows "Back to login" link', () => {
    renderForm();

    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });
});
