import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RetentionPolicySelect } from '../RetentionPolicySelect';

describe('RetentionPolicySelect', () => {
  it('renders a select with the 4 retention options', () => {
    render(
      <RetentionPolicySelect
        retentionPolicy="7d"
        onRetentionChange={vi.fn()}
      />,
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    expect(screen.getByRole('option', { name: /5 days/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /7 days/i })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /30 days/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /never/i })).toBeInTheDocument();
  });

  it('shows the current retentionPolicy as the selected value', () => {
    render(
      <RetentionPolicySelect
        retentionPolicy="30d"
        onRetentionChange={vi.fn()}
      />,
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('30d');
  });

  it('calls onRetentionChange with "5d" when "5 days" option is selected', async () => {
    const user = userEvent.setup();
    const onRetentionChange = vi.fn();

    render(
      <RetentionPolicySelect
        retentionPolicy="7d"
        onRetentionChange={onRetentionChange}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox'), '5d');

    expect(onRetentionChange).toHaveBeenCalledOnce();
    expect(onRetentionChange).toHaveBeenCalledWith('5d');
  });

  it('calls onRetentionChange with "never" when "Never" option is selected', async () => {
    const user = userEvent.setup();
    const onRetentionChange = vi.fn();

    render(
      <RetentionPolicySelect
        retentionPolicy="7d"
        onRetentionChange={onRetentionChange}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox'), 'never');

    expect(onRetentionChange).toHaveBeenCalledOnce();
    expect(onRetentionChange).toHaveBeenCalledWith('never');
  });
});
