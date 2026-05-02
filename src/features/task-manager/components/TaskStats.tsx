interface TaskStatsData {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

interface TaskStatsProps {
  stats: TaskStatsData;
}

interface StatItem {
  label: string;
  value: number;
  className: string;
}

export function TaskStats({ stats }: TaskStatsProps) {
  const items: StatItem[] = [
    {
      label: 'Total',
      value: stats.total,
      className:
        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    },
    {
      label: 'Todo',
      value: stats.todo,
      className:
        'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      className:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    },
    {
      label: 'Done',
      value: stats.done,
      className:
        'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg border p-4 ${item.className}`}
        >
          <p className="text-2xl font-bold">{item.value}</p>
          <p className="text-xs font-medium">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
