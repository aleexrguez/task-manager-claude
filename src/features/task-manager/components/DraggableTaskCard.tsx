import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../types';
import { TaskCard } from './TaskCard';

interface DraggableTaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onArchive?: (id: string) => void;
  isDeleting?: boolean;
}

export function DraggableTaskCard({
  task,
  onDelete,
  onClick,
  onArchive,
  isDeleting,
}: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className="group/drag relative">
      <button
        type="button"
        aria-label="Drag handle"
        className="absolute left-1 top-1/2 z-10 -translate-y-1/2 cursor-grab rounded p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-600 group-hover/drag:opacity-100 dark:text-gray-500 dark:hover:text-gray-300"
        {...listeners}
        {...attributes}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5.5" cy="3.5" r="1.5" />
          <circle cx="10.5" cy="3.5" r="1.5" />
          <circle cx="5.5" cy="8" r="1.5" />
          <circle cx="10.5" cy="8" r="1.5" />
          <circle cx="5.5" cy="12.5" r="1.5" />
          <circle cx="10.5" cy="12.5" r="1.5" />
        </svg>
      </button>
      <div className="pl-6">
        <TaskCard
          task={task}
          onDelete={onDelete}
          onClick={onClick}
          onArchive={onArchive}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
