import type { TaskBoard } from '../utils';
import { BoardColumn } from './BoardColumn';

interface BoardViewProps {
  board: TaskBoard;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onArchive?: (id: string) => void;
  deletingId?: string | null;
}

export function BoardView({
  board,
  onEdit,
  onDelete,
  onClick,
  onArchive,
  deletingId,
}: BoardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <BoardColumn
        title="Todo"
        tasks={board.todo}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
        onArchive={onArchive}
        deletingId={deletingId}
      />
      <BoardColumn
        title="In Progress"
        tasks={board['in-progress']}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
        onArchive={onArchive}
        deletingId={deletingId}
      />
      <BoardColumn
        title="Done"
        tasks={board.done}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
        onArchive={onArchive}
        deletingId={deletingId}
      />
    </div>
  );
}
