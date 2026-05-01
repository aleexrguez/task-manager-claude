import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RecurrenceForm } from '../RecurrenceForm';

describe('RecurrenceForm — autoFocusTitle', () => {
  it('does not focus title input by default', () => {
    render(<RecurrenceForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/title/i)).not.toHaveFocus();
  });

  it('focuses title input when autoFocusTitle is true', () => {
    render(<RecurrenceForm onSubmit={vi.fn()} autoFocusTitle />);

    expect(screen.getByLabelText(/title/i)).toHaveFocus();
  });

  it('does not focus title when autoFocusTitle is false', () => {
    render(<RecurrenceForm onSubmit={vi.fn()} autoFocusTitle={false} />);

    expect(screen.getByLabelText(/title/i)).not.toHaveFocus();
  });
});
