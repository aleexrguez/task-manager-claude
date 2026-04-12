import { useMemo } from 'react';
import { useTasks } from '../hooks/use-tasks';
import { useAutoPurge } from '../hooks/use-auto-purge';
import { useTaskUIStore } from '../store/task-ui.store';
import { getTaskStats } from '../utils/task.utils';
import { TaskStats, ViewToggle, RetentionConfig } from '../components';
import { TaskListContainer } from './TaskListContainer';
import { CreateTaskContainer } from './CreateTaskContainer';
import { EditTaskContainer } from './EditTaskContainer';

export function TaskDashboardContainer() {
  const { data } = useTasks();
  const openCreateModal = useTaskUIStore((s) => s.openCreateModal);
  const isDarkMode = useTaskUIStore((s) => s.isDarkMode);
  const toggleDarkMode = useTaskUIStore((s) => s.toggleDarkMode);
  const viewMode = useTaskUIStore((s) => s.viewMode);
  const setViewMode = useTaskUIStore((s) => s.setViewMode);
  const retentionPolicy = useTaskUIStore((s) => s.retentionPolicy);
  const setRetentionPolicy = useTaskUIStore((s) => s.setRetentionPolicy);

  const stats = useMemo(() => getTaskStats(data?.tasks ?? []), [data]);
  const totalTasks = data?.tasks?.length ?? 0;

  useAutoPurge(data?.tasks ?? []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Task Manager
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {totalTasks === 0
                ? 'No tasks yet'
                : `${totalTasks} task${totalTasks === 1 ? '' : 's'} total`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <RetentionConfig
              retentionPolicy={retentionPolicy}
              onRetentionChange={setRetentionPolicy}
            />
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-lg shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              aria-label={
                isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
              }
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span aria-hidden="true">+</span>
              New Task
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <TaskStats stats={stats} />
          <TaskListContainer />
        </div>
      </div>

      <CreateTaskContainer />
      <EditTaskContainer />
    </div>
  );
}
