import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RecurrenceForm } from '../RecurrenceForm';

describe('RecurrenceForm — base fields', () => {
  it('renders title, description, priority, and frequency fields', () => {
    render(<RecurrenceForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
  });

  it('renders a submit button with default label', () => {
    render(<RecurrenceForm onSubmit={vi.fn()} />);

    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('renders a custom submit label when provided', () => {
    render(<RecurrenceForm onSubmit={vi.fn()} submitLabel="Save Recurrence" />);

    expect(
      screen.getByRole('button', { name: /save recurrence/i }),
    ).toBeInTheDocument();
  });

  it('disables submit button when isSubmitting is true', () => {
    render(<RecurrenceForm onSubmit={vi.fn()} isSubmitting />);

    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('populates title from initialValues', () => {
    render(
      <RecurrenceForm
        onSubmit={vi.fn()}
        initialValues={{ title: 'Morning Run', frequency: 'daily' }}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue('Morning Run');
  });
});

describe('RecurrenceForm — conditional fields', () => {
  it('does not show WeeklyDaysPicker or monthlyDay input when frequency is daily', () => {
    render(<RecurrenceForm onSubmit={vi.fn()} />);

    // Default frequency is daily — no extra fields
    expect(
      screen.queryByLabelText(/monthly day/i),
    ).not.toBeInTheDocument();
  });

  it('shows WeeklyDaysPicker when frequency is weekly', async () => {
    const user = userEvent.setup();
    render(<RecurrenceForm onSubmit={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/frequency/i), 'weekly');

    // WeeklyDaysPicker renders day buttons Mon-Sun
    expect(screen.getByRole('button', { name: 'Mon' })).toBeInTheDocument();
  });

  it('shows monthlyDay input when frequency is monthly', async () => {
    const user = userEvent.setup();
    render(<RecurrenceForm onSubmit={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/frequency/i), 'monthly');

    expect(screen.getByLabelText(/monthly day/i)).toBeInTheDocument();
  });

  it('hides WeeklyDaysPicker when switching from weekly to daily', async () => {
    const user = userEvent.setup();
    render(<RecurrenceForm onSubmit={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/frequency/i), 'weekly');
    await user.selectOptions(screen.getByLabelText(/frequency/i), 'daily');

    expect(
      screen.queryByRole('button', { name: 'Mon' }),
    ).not.toBeInTheDocument();
  });
});

describe('RecurrenceForm — submission', () => {
  it('calls onSubmit with correct shape for daily frequency', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RecurrenceForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Daily Standup');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'daily',
        title: 'Daily Standup',
      }),
    );
  });

  it('calls onSubmit with weeklyDays for weekly frequency', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RecurrenceForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Weekly Review');
    await user.selectOptions(screen.getByLabelText(/frequency/i), 'weekly');
    await user.click(screen.getByRole('button', { name: 'Mon' }));
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'weekly',
        title: 'Weekly Review',
        weeklyDays: [1],
      }),
    );
  });

  it('calls onSubmit with monthlyDay for monthly frequency', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RecurrenceForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Monthly Report');
    await user.selectOptions(screen.getByLabelText(/frequency/i), 'monthly');
    await user.clear(screen.getByLabelText(/monthly day/i));
    await user.type(screen.getByLabelText(/monthly day/i), '15');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'monthly',
        title: 'Monthly Report',
        monthlyDay: 15,
      }),
    );
  });

  it('does not call onSubmit when title is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RecurrenceForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error when weekly is selected with no days chosen', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RecurrenceForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Weekly Review');
    await user.selectOptions(screen.getByLabelText(/frequency/i), 'weekly');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/select at least one day/i)).toBeInTheDocument();
  });
});
