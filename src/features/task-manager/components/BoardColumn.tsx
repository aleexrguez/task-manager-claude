import type { Task } from '../types';
import { TaskCard } from './TaskCard';

interface BoardColumnProps {
  title: string;
  tasks: Task[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onArchive?: (id: string) => void;
  deletingId?: string | null;
}

export function BoardColumn({
  title,
  tasks,
  onEdit,
  onDelete,
  onClick,
  onArchive,
  deletingId = null,
}: BoardColumnProps) {
  return (
    <div className="flex flex-col rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {title}
        </h2>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">No tasks</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={onClick}
              onArchive={onArchive}
              isDeleting={deletingId === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
