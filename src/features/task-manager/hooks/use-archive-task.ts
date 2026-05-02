import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveTask, unarchiveTask } from '../api';
import type { TaskListResponse } from '../api';
import { taskKeys } from './task.keys';

export function useArchiveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      const previous = queryClient.getQueryData<TaskListResponse>(
        taskKeys.lists(),
      );
      if (previous) {
        queryClient.setQueryData<TaskListResponse>(taskKeys.lists(), {
          ...previous,
          tasks: previous.tasks.map((t) =>
            t.id === id ? { ...t, isArchived: true } : t,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.lists(), context.previous);
      }
    },
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useUnarchiveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unarchiveTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      const previous = queryClient.getQueryData<TaskListResponse>(
        taskKeys.lists(),
      );
      if (previous) {
        queryClient.setQueryData<TaskListResponse>(taskKeys.lists(), {
          ...previous,
          tasks: previous.tasks.map((t) =>
            t.id === id ? { ...t, isArchived: false } : t,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.lists(), context.previous);
      }
    },
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}
