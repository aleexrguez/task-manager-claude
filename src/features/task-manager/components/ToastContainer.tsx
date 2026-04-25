import { useEffect } from 'react';
import { useToastStore } from '../store/toast.store';
import { Toast } from './Toast';

const AUTO_DISMISS_MS = 4000;

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, removeToast]);

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={removeToast}
        />
      ))}
    </div>
  );
}
