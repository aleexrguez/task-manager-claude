import type {
  RetentionPolicy,
  ThemePreference,
} from '@/shared/types/preferences.types';
import { RetentionPolicySelect } from '@/shared/components/RetentionPolicySelect';
import { ThemeSelector } from './ThemeSelector';

interface SettingsPageProps {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  retentionPolicy: RetentionPolicy;
  onRetentionPolicyChange: (policy: RetentionPolicy) => void;
  userEmail: string;
  onSignOut: () => void;
  isSigningOut: boolean;
  remindersEnabled: boolean;
  onToggleReminders: () => void;
}

const CARD = 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm';

export function SettingsPage({
  theme,
  onThemeChange,
  retentionPolicy,
  onRetentionPolicyChange,
  userEmail,
  onSignOut,
  isSigningOut,
  remindersEnabled,
  onToggleReminders,
}: SettingsPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Settings
      </h1>

      {/* Section 1 — Appearance */}
      <section className={CARD}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Appearance
        </h2>
        <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
      </section>

      {/* Section 2 — Data Retention */}
      <section className={CARD}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Retention
        </h2>
        <label
          htmlFor="retention-policy"
          className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300"
        >
          Automatically delete completed tasks after:
          <RetentionPolicySelect
            id="retention-policy"
            retentionPolicy={retentionPolicy}
            onRetentionChange={onRetentionPolicyChange}
          />
        </label>
      </section>

      {/* Section 3 — Notifications */}
      <section className={CARD}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Notifications
        </h2>
        <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={remindersEnabled}
            onChange={onToggleReminders}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Due date reminders
        </label>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Show popup reminders for tasks that are overdue or due soon.
        </p>
      </section>

      {/* Section 4 — Account */}
      <section className={CARD}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Account
        </h2>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
              Email
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {userEmail}
            </p>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Password management coming soon.
          </p>
        </div>
      </section>
    </div>
  );
}
