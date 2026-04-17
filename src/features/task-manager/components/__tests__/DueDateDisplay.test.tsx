import { render, screen } from '@testing-library/react';
import { DueDateDisplay } from '../DueDateDisplay';

describe('DueDateDisplay', () => {
  describe('visibility rules', () => {
    it('returns null when dueDate is undefined', () => {
      const { container } = render(
        <DueDateDisplay dueDate={undefined} status="todo" today="2026-04-17" />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('returns null when status is done', () => {
      const { container } = render(
        <DueDateDisplay
          dueDate="2026-04-10"
          status="done"
          today="2026-04-17"
        />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders for todo status', () => {
      const { container } = render(
        <DueDateDisplay
          dueDate="2026-04-25"
          status="todo"
          today="2026-04-17"
        />,
      );

      expect(container).not.toBeEmptyDOMElement();
    });

    it('renders for in-progress status', () => {
      const { container } = render(
        <DueDateDisplay
          dueDate="2026-04-25"
          status="in-progress"
          today="2026-04-17"
        />,
      );

      expect(container).not.toBeEmptyDOMElement();
    });
  });

  describe('text tiers', () => {
    it('shows "5 days left" when due in 5 days', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-22"
          status="todo"
          today="2026-04-17"
        />,
      );

      expect(screen.getByText('5 days left')).toBeInTheDocument();
    });

    it('shows "3 days left" when due in 3 days', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-20"
          status="todo"
          today="2026-04-17"
        />,
      );

      expect(screen.getByText('3 days left')).toBeInTheDocument();
    });

    it('shows "2 days left" when due in 2 days', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-19"
          status="todo"
          today="2026-04-17"
        />,
      );

      expect(screen.getByText('2 days left')).toBeInTheDocument();
    });

    it('shows "Tomorrow" when due in 1 day', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-18"
          status="todo"
          today="2026-04-17"
        />,
      );

      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });

    it('shows "Due today" when due today', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-17"
          status="todo"
          today="2026-04-17"
        />,
      );

      expect(screen.getByText('Due today')).toBeInTheDocument();
    });

    it('shows "Overdue" when past due', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-10"
          status="todo"
          today="2026-04-17"
        />,
      );

      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
  });

  describe('color tiers', () => {
    it('uses green styling when due in more than 3 days', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-22"
          status="todo"
          today="2026-04-17"
        />,
      );

      const badge = screen.getByText('5 days left');
      expect(badge.className).toContain('bg-green');
    });

    it('uses amber styling when due in exactly 3 days', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-20"
          status="todo"
          today="2026-04-17"
        />,
      );

      const badge = screen.getByText('3 days left');
      expect(badge.className).toContain('bg-amber');
    });

    it('uses amber styling when due in 2 days', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-19"
          status="todo"
          today="2026-04-17"
        />,
      );

      const badge = screen.getByText('2 days left');
      expect(badge.className).toContain('bg-amber');
    });

    it('uses amber styling for tomorrow', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-18"
          status="todo"
          today="2026-04-17"
        />,
      );

      const badge = screen.getByText('Tomorrow');
      expect(badge.className).toContain('bg-amber');
    });

    it('uses red styling for due today', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-17"
          status="todo"
          today="2026-04-17"
        />,
      );

      const badge = screen.getByText('Due today');
      expect(badge.className).toContain('bg-red');
    });

    it('uses red styling for overdue', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-10"
          status="todo"
          today="2026-04-17"
        />,
      );

      const badge = screen.getByText('Overdue');
      expect(badge.className).toContain('bg-red');
    });

    it('uses font-semibold for overdue emphasis', () => {
      render(
        <DueDateDisplay
          dueDate="2026-04-10"
          status="todo"
          today="2026-04-17"
        />,
      );

      const badge = screen.getByText('Overdue');
      expect(badge.className).toContain('font-semibold');
    });
  });
});
