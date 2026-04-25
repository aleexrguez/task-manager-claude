import type { ToastType } from '../store/toast.store';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

const colorClasses: Record<ToastType, string> = {
  success:
    'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
  error:
    'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
  info: 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
};

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  const role = type === 'error' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-md border-l-4 p-4 shadow-md ${colorClasses[type]}`}
    >
      <span className="flex-1 text-sm">{message}</span>
      <button
        type="button"
        aria-label={`Dismiss notification: ${message}`}
        onClick={() => onDismiss(id)}
        className="shrink-0 text-sm font-medium opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        ✕
      </button>
    </div>
  );
}
