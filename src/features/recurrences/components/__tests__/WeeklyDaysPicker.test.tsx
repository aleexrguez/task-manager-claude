import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WeeklyDaysPicker } from '../WeeklyDaysPicker';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

describe('WeeklyDaysPicker', () => {
  it('renders all 7 day buttons', () => {
    render(<WeeklyDaysPicker selectedDays={[]} onChange={vi.fn()} />);

    for (const label of DAY_LABELS) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('marks selected days as visually distinct via aria-pressed', () => {
    render(<WeeklyDaysPicker selectedDays={[1, 3]} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Mon' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Wed' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Tue' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onChange with the new day added when an unselected day is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<WeeklyDaysPicker selectedDays={[1]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Wed' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith([1, 3]);
  });

  it('calls onChange with the day removed when a selected day is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<WeeklyDaysPicker selectedDays={[1, 3, 5]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Mon' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith([3, 5]);
  });

  it('returns a sorted array when days are toggled in non-sequential order', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<WeeklyDaysPicker selectedDays={[5, 3]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Mon' }));

    expect(onChange).toHaveBeenCalledWith([1, 3, 5]);
  });

  it('handles empty selectedDays without errors', () => {
    expect(() =>
      render(<WeeklyDaysPicker selectedDays={[]} onChange={vi.fn()} />),
    ).not.toThrow();

    for (const label of DAY_LABELS) {
      expect(screen.getByRole('button', { name: label })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    }
  });
});
