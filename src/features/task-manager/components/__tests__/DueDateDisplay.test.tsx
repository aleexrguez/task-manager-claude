import { render, screen } from '@testing-library/react';
import { DueDateDisplay } from '../DueDateDisplay';

describe('DueDateDisplay', () => {
  it('renders nothing when dueDate is undefined', () => {
    const { container } = render(
      <DueDateDisplay dueDate={undefined} status="todo" today="2026-04-11" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the formatted due date when dueDate is provided', () => {
    render(
      <DueDateDisplay dueDate="2026-04-15" status="todo" today="2026-04-11" />,
    );

    expect(
      screen.getByText(/2026-04-15|Apr(il)?\s+15|15.*Apr/i),
    ).toBeInTheDocument();
  });

  it('renders overdue indicator when dueDate is before today and status is not done', () => {
    render(
      <DueDateDisplay dueDate="2026-04-01" status="todo" today="2026-04-11" />,
    );

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('does NOT render overdue indicator when dueDate equals today', () => {
    render(
      <DueDateDisplay dueDate="2026-04-11" status="todo" today="2026-04-11" />,
    );

    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });

  it('does NOT render overdue indicator when status is done even if dueDate is past', () => {
    render(
      <DueDateDisplay dueDate="2026-04-01" status="done" today="2026-04-11" />,
    );

    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });

  it('does NOT render overdue indicator when dueDate is in the future', () => {
    render(
      <DueDateDisplay dueDate="2026-12-31" status="todo" today="2026-04-11" />,
    );

    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });
});
