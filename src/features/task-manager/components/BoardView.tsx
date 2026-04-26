import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../types';
import type { TaskBoard } from '../utils';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';

interface BoardViewProps {
  board: TaskBoard;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onArchive?: (id: string) => void;
  deletingId?: string | null;
  onBoardChange?: (board: TaskBoard) => void;
}

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];
const STATUS_SET = new Set<string>(STATUSES);

function findContainer(board: TaskBoard, taskId: string): TaskStatus | null {
  for (const status of STATUSES) {
    if (board[status].some((t) => t.id === taskId)) {
      return status;
    }
  }
  return null;
}

function isActiveBelow(
  activeRect: { top: number; height: number } | null,
  overRect: { top: number; height: number },
): boolean {
  if (!activeRect) return false;
  const activeCenterY = activeRect.top + activeRect.height / 2;
  const overMiddleY = overRect.top + overRect.height / 2;
  return activeCenterY > overMiddleY;
}

function resolveStatus(
  overId: string,
  overData: Record<string, unknown> | undefined,
): TaskStatus | null {
  if (STATUS_SET.has(overId)) return overId as TaskStatus;

  const status = overData?.status as string | undefined;
  if (status && STATUS_SET.has(status)) return status as TaskStatus;

  const containerId = (overData?.sortable as { containerId?: string })
    ?.containerId;
  if (containerId && STATUS_SET.has(containerId)) {
    return containerId as TaskStatus;
  }

  return null;
}

export function BoardView({
  board,
  onDelete,
  onClick,
  onArchive,
  deletingId,
  onBoardChange,
}: BoardViewProps) {
  const [localBoard, setLocalBoard] = useState<TaskBoard>(board);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const isDraggingRef = useRef(false);

  // Sync localBoard with board prop — preserve local order when only task properties changed
  useEffect(() => {
    if (isDraggingRef.current) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalBoard((prev) => {
      // Check if each column has the same task IDs (order may differ)
      const sameStructure = STATUSES.every((status) => {
        const prevIds = new Set(prev[status].map((t) => t.id));
        const boardIds = new Set(board[status].map((t) => t.id));
        if (prevIds.size !== boardIds.size) return false;
        for (const id of prevIds) {
          if (!boardIds.has(id)) return false;
        }
        return true;
      });

      if (!sameStructure) return board;

      // Same IDs per column → keep local order, update task properties
      const incoming = new Map<string, Task>();
      for (const status of STATUSES) {
        for (const task of board[status]) {
          incoming.set(task.id, task);
        }
      }
      const update = (t: Task) => incoming.get(t.id) ?? t;
      return {
        todo: prev.todo.map(update),
        'in-progress': prev['in-progress'].map(update),
        done: prev.done.map(update),
      };
    });
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent): void {
    isDraggingRef.current = true;
    const taskId = String(event.active.id);
    const container = findContainer(localBoard, taskId);
    if (container) {
      const task = localBoard[container].find((t) => t.id === taskId);
      setActiveTask(task ?? null);
    }
  }

  function handleDragOver(event: DragOverEvent): void {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const sourceStatus = findContainer(localBoard, activeId);
    const overStatus = resolveStatus(overId, over.data.current);

    if (!sourceStatus || !overStatus) return;

    if (sourceStatus === overStatus) {
      // Same column reorder
      const column = localBoard[sourceStatus];
      const oldIndex = column.findIndex((t) => t.id === activeId);
      const newIndex = column.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      setLocalBoard((prev) => ({
        ...prev,
        [sourceStatus]: arrayMove(prev[sourceStatus], oldIndex, newIndex),
      }));
    } else {
      // Cross-column move
      const sourceColumn = localBoard[sourceStatus];
      const destColumn = localBoard[overStatus];
      const sourceIndex = sourceColumn.findIndex((t) => t.id === activeId);

      if (sourceIndex === -1) return;

      const movedTask = { ...sourceColumn[sourceIndex], status: overStatus };
      const newSource = sourceColumn.filter((t) => t.id !== activeId);

      // Find insertion index in destination
      let destIndex = destColumn.findIndex((t) => t.id === overId);
      if (destIndex === -1) {
        // Dropped on empty column or column droppable — append
        destIndex = destColumn.length;
      } else if (isActiveBelow(active.rect.current.translated, over.rect)) {
        // Pointer below midpoint of over item — insert after
        destIndex += 1;
      }

      const newDest = [...destColumn];
      newDest.splice(destIndex, 0, movedTask);

      setLocalBoard((prev) => ({
        ...prev,
        [sourceStatus]: newSource,
        [overStatus]: newDest,
      }));
    }
  }

  function handleDragEnd(): void {
    isDraggingRef.current = false;
    setActiveTask(null);
    onBoardChange?.(localBoard);
  }

  function handleDragCancel(): void {
    isDraggingRef.current = false;
    setActiveTask(null);
    setLocalBoard(board);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BoardColumn
          title="Todo"
          tasks={localBoard.todo}
          status="todo"
          onDelete={onDelete}
          onClick={onClick}
          onArchive={onArchive}
          deletingId={deletingId}
        />
        <BoardColumn
          title="In Progress"
          tasks={localBoard['in-progress']}
          status="in-progress"
          onDelete={onDelete}
          onClick={onClick}
          onArchive={onArchive}
          deletingId={deletingId}
        />
        <BoardColumn
          title="Done"
          tasks={localBoard.done}
          status="done"
          onDelete={onDelete}
          onClick={onClick}
          onArchive={onArchive}
          deletingId={deletingId}
        />
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
