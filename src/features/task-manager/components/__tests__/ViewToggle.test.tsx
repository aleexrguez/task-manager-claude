import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ViewToggle } from '../ViewToggle';

describe('ViewToggle', () => {
  it('renders two buttons: one for List view and one for Board view', () => {
    render(<ViewToggle viewMode="list" onViewModeChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /board/i })).toBeInTheDocument();
  });

  it('marks the active view mode button with aria-pressed="true"', () => {
    render(<ViewToggle viewMode="list" onViewModeChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /list/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('marks the non-active button with aria-pressed="false"', () => {
    render(<ViewToggle viewMode="list" onViewModeChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /board/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onViewModeChange with "board" when Board button is clicked', async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();

    render(<ViewToggle viewMode="list" onViewModeChange={onViewModeChange} />);

    await user.click(screen.getByRole('button', { name: /board/i }));

    expect(onViewModeChange).toHaveBeenCalledOnce();
    expect(onViewModeChange).toHaveBeenCalledWith('board');
  });

  it('calls onViewModeChange with "list" when List button is clicked', async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();

    render(<ViewToggle viewMode="board" onViewModeChange={onViewModeChange} />);

    await user.click(screen.getByRole('button', { name: /list/i }));

    expect(onViewModeChange).toHaveBeenCalledOnce();
    expect(onViewModeChange).toHaveBeenCalledWith('list');
  });
});
