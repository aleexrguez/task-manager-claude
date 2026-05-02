import { useMemo } from 'react';
import { useTasks } from '../hooks/use-tasks';
import { useAutoPurge } from '../hooks/use-auto-purge';
import { useTaskUIStore } from '../store/task-ui.store';
import { getTaskStats, filterVisibleTasks } from '../utils/task.utils';
import { TaskStats, ViewToggle } from '../components';
import { TaskListContainer } from './TaskListContainer';
import { CreateTaskContainer } from './CreateTaskContainer';
import { EditTaskContainer } from './EditTaskContainer';

export function TaskDashboardContainer() {
  const { data } = useTasks();
  const openCreateModal = useTaskUIStore((s) => s.openCreateModal);
  const viewMode = useTaskUIStore((s) => s.viewMode);
  const setViewMode = useTaskUIStore((s) => s.setViewMode);
  const showArchived = useTaskUIStore((s) => s.showArchived);

  const visibleTasks = useMemo(
    () => filterVisibleTasks(data?.tasks ?? [], showArchived),
    [data, showArchived],
  );
  const stats = useMemo(() => getTaskStats(visibleTasks), [visibleTasks]);
  const totalTasks = visibleTasks.length;

  useAutoPurge(data?.tasks ?? []);

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalTasks === 0
              ? 'No tasks yet'
              : `${totalTasks} task${totalTasks === 1 ? '' : 's'} shown`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <button
            type="button"
            onClick={openCreateModal}
            className="cursor-pointer flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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

      <CreateTaskContainer />
      <EditTaskContainer />
    </>
  );
}
