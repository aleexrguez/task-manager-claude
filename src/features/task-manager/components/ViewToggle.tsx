import type { ViewMode } from '../types';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        aria-pressed={viewMode === 'list'}
        onClick={() => onViewModeChange('list')}
        className="rounded-l-lg px-3 py-1.5 text-sm font-medium transition-colors aria-pressed:bg-indigo-600 aria-pressed:text-white"
      >
        List
      </button>
      <button
        aria-pressed={viewMode === 'board'}
        onClick={() => onViewModeChange('board')}
        className="rounded-r-lg px-3 py-1.5 text-sm font-medium transition-colors aria-pressed:bg-indigo-600 aria-pressed:text-white"
      >
        Board
      </button>
    </div>
  );
}
