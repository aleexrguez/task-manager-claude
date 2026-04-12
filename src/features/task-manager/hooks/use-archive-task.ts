import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveTask, unarchiveTask } from '../api';
import { taskKeys } from './task.keys';

export function useArchiveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveTask(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useUnarchiveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unarchiveTask(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}
