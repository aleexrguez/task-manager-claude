import type { RecurrenceTemplate } from '../types/recurrence.types';
import { RecurrenceCard } from './RecurrenceCard';

interface RecurrenceListProps {
  templates: RecurrenceTemplate[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export function RecurrenceList({
  templates,
  onEdit,
  onDelete,
  emptyMessage = 'No recurrences found',
}: RecurrenceListProps) {
  if (templates.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {templates.map((template) => (
        <RecurrenceCard
          key={template.id}
          template={template}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
