import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useDeleteTask } from '../hooks/use-tasks';
import { useArchiveTask } from '../hooks/use-archive-task';
import { useTaskUIStore } from '../store/task-ui.store';
import {
  filterTasksByStatus,
  filterVisibleTasks,
  sortTasks,
  groupTasksByStatus,
} from '../utils/task.utils';
import { TaskFilters, TaskList, ConfirmDialog, BoardView } from '../components';

export function TaskListContainer() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useTasks();
  const {
    mutate: deleteTask,
    isPending: isDeleting,
    variables: deletingId,
  } = useDeleteTask();
  const { mutate: archiveTask } = useArchiveTask();

  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const statusFilter = useTaskUIStore((s) => s.statusFilter);
  const priorityFilter = useTaskUIStore((s) => s.priorityFilter);
  const searchQuery = useTaskUIStore((s) => s.searchQuery);
  const showArchived = useTaskUIStore((s) => s.showArchived);
  const viewMode = useTaskUIStore((s) => s.viewMode);
  const setStatusFilter = useTaskUIStore((s) => s.setStatusFilter);
  const setPriorityFilter = useTaskUIStore((s) => s.setPriorityFilter);
  const setSearchQuery = useTaskUIStore((s) => s.setSearchQuery);
  const resetFilters = useTaskUIStore((s) => s.resetFilters);
  const openEditModal = useTaskUIStore((s) => s.openEditModal);
  const openCreateModal = useTaskUIStore((s) => s.openCreateModal);

  const filteredTasks = useMemo(() => {
    const allTasks = data?.tasks ?? [];

    let result = filterVisibleTasks(allTasks, showArchived);

    result =
      statusFilter === 'all'
        ? result
        : filterTasksByStatus(result, statusFilter);

    if (priorityFilter !== 'all') {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((task) =>
        task.title.toLowerCase().includes(query),
      );
    }

    return sortTasks(result);
  }, [data, statusFilter, priorityFilter, searchQuery, showArchived]);

  function handleDelete(id: string): void {
    setTaskToDelete(id);
  }

  function handleConfirmDelete(): void {
    if (!taskToDelete) return;
    deleteTask(taskToDelete, {
      onSuccess: () => {
        setTaskToDelete(null);
      },
    });
  }

  function handleCancelDelete(): void {
    setTaskToDelete(null);
  }

  function handleArchive(id: string): void {
    archiveTask(id);
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong.';
    return (
      <div className="flex flex-col gap-4">
        <TaskFilters
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          searchQuery={searchQuery}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onSearchChange={setSearchQuery}
          onReset={resetFilters}
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {message}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-300 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const board = groupTasksByStatus(filteredTasks);

  return (
    <>
      <div className="flex flex-col gap-4">
        <TaskFilters
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          searchQuery={searchQuery}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onSearchChange={setSearchQuery}
          onReset={resetFilters}
        />
        {viewMode === 'board' ? (
          <BoardView
            board={board}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onClick={(id) => navigate(`/app/tasks/${id}`)}
            onArchive={handleArchive}
            deletingId={isDeleting ? (deletingId ?? null) : null}
          />
        ) : (
          <TaskList
            tasks={filteredTasks}
            isLoading={isLoading}
            deletingId={isDeleting ? (deletingId ?? null) : null}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onClick={(id) => navigate(`/app/tasks/${id}`)}
            onCreateNew={openCreateModal}
            onArchive={handleArchive}
          />
        )}
      </div>
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
