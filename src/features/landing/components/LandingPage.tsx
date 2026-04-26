import { Link } from 'react-router-dom';
import { useApplyTheme } from '@/shared/hooks/use-apply-theme';
import { useAppPreferencesStore } from '@/shared/store/app-preferences.store';
import type { ThemePreference } from '@/shared/types/preferences.types';

const features = [
  {
    title: 'Kanban Board',
    description:
      'Visualize your workflow with drag-and-drop columns. Move tasks between Todo, In Progress, and Done.',
  },
  {
    title: 'Recurring Tasks',
    description:
      'Set up daily, weekly, or monthly recurring tasks that generate automatically.',
  },
  {
    title: 'Smart Reminders',
    description:
      'Get notified about overdue and upcoming tasks with priority-based alerts.',
  },
  {
    title: 'Persistent Ordering',
    description:
      'Your board order is saved automatically. Drag once, stay organized forever.',
  },
];

function nextTheme(current: ThemePreference): ThemePreference {
  if (current === 'light') return 'dark';
  return 'light';
}

function themeIcon(current: ThemePreference): string {
  if (current === 'dark' || current === 'system') return '☀️';
  return '🌙';
}

export function LandingPage() {
  useApplyTheme();

  const theme = useAppPreferencesStore((s) => s.theme);
  const setTheme = useAppPreferencesStore((s) => s.setTheme);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/Logo.png"
              alt="TaskOps"
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              TaskOps
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(nextTheme(theme))}
              aria-label={`Switch to ${nextTheme(theme)} mode`}
              className="cursor-pointer rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
            >
              {themeIcon(theme)}
            </button>
            <Link
              to="/login"
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center justify-center px-4 py-20 text-center sm:py-28">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
            Ship Work, Not Chaos
          </h1>
          <p className="mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-400">
            TaskOps is a lightweight task manager built for developers and small
            teams. Kanban boards, recurring tasks, smart reminders — everything
            you need to stay on track.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              to="/register"
              className="cursor-pointer rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="cursor-pointer rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Login
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-200 bg-white px-4 py-16 dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
              Everything you need, nothing you don't
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-lg border border-gray-200 p-6 dark:border-gray-700"
                >
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        TaskOps V1 — Built with React + Supabase
      </footer>
    </div>
  );
}
