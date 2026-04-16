export const recurrenceKeys = {
  all: ['recurrences'] as const,
  lists: () => [...recurrenceKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...recurrenceKeys.lists(), filters] as const,
  details: () => [...recurrenceKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurrenceKeys.details(), id] as const,
};
