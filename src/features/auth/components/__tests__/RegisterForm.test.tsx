import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from '../RegisterForm';

function renderRegisterForm(
  props: Partial<Parameters<typeof RegisterForm>[0]> = {},
) {
  return render(
    <MemoryRouter>
      <RegisterForm
        onSubmit={vi.fn()}
        isPending={false}
        error={null}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('RegisterForm — password visibility toggle', () => {
  it('renders both password inputs with type="password" by default', () => {
    renderRegisterForm();

    const passwordInputs = screen.getAllByPlaceholderText('••••••');
    expect(passwordInputs).toHaveLength(2);
    expect(passwordInputs[0]).toHaveAttribute('type', 'password');
    expect(passwordInputs[1]).toHaveAttribute('type', 'password');
  });

  it('toggles password field independently from confirm password', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    const toggleButtons = screen.getAllByRole('button', {
      name: /show password/i,
    });
    expect(toggleButtons).toHaveLength(2);

    await user.click(toggleButtons[0]);

    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('toggles confirm password field independently from password', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    const toggleButtons = screen.getAllByRole('button', {
      name: /show password/i,
    });

    await user.click(toggleButtons[1]);

    expect(screen.getByLabelText(/^password/i)).toHaveAttribute(
      'type',
      'password',
    );
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
      'type',
      'text',
    );
  });
});
