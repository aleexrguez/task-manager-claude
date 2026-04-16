import { useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getPendingGenerations } from '../utils/recurrence.utils';
import { generateTasks } from '../api/recurrence-api';
import { taskKeys } from '@/features/task-manager/hooks/task.keys';
import type { RecurrenceTemplate } from '../types/recurrence.types';
import type { Task } from '@/features/task-manager/types/task.types';

export function useAutoGenerate(
  templates: RecurrenceTemplate[],
  tasks: Task[],
): void {
  const queryClient = useQueryClient();
  const lastRunRef = useRef<string>('');

  useEffect(() => {
    const pending = getPendingGenerations(templates, tasks);
    if (pending.length === 0) return;

    const key = pending
      .map((p) => `${p.templateId}:${p.dateKey}`)
      .sort()
      .join(',');
    if (key === lastRunRef.current) return;
    lastRunRef.current = key;

    generateTasks(pending).then(() => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    });
  }, [templates, tasks, queryClient]);
}
