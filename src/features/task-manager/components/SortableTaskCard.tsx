import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import { TaskCard } from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onArchive?: (id: string) => void;
  isDeleting?: boolean;
}

export function SortableTaskCard({
  task,
  onDelete,
  onClick,
  onArchive,
  isDeleting,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onDelete={onDelete}
        onClick={onClick}
        onArchive={onArchive}
        isDeleting={isDeleting}
      />
    </div>
  );
}
