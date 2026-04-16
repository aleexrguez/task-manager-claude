import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks';
import { recurrenceKeys } from './recurrence.keys';
import { taskKeys } from '@/features/task-manager/hooks/task.keys';
import {
  fetchRecurrences,
  fetchRecurrenceById,
  createRecurrence,
  updateRecurrence,
  deleteRecurrence,
} from '../api/recurrence-api';
import type {
  CreateRecurrenceInput,
  UpdateRecurrenceInput,
} from '../types/recurrence.types';

export function useRecurrences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: recurrenceKeys.lists(),
    queryFn: fetchRecurrences,
    enabled: !!user,
  });
}

export function useRecurrence(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: recurrenceKeys.detail(id),
    queryFn: () => fetchRecurrenceById(id),
    enabled: !!user && !!id,
  });
}

export function useCreateRecurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecurrenceInput) => createRecurrence(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.lists() });
    },
  });
}

export function useUpdateRecurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRecurrenceInput }) =>
      updateRecurrence(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.detail(id) });
    },
  });
}

export function useDeleteRecurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecurrence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
