import { Link } from 'react-router-dom';
import { useResetPassword } from '../hooks';
import { ForgotPasswordForm } from '../components';
import { useApplyTheme } from '@/shared/hooks/use-apply-theme';
import type { ForgotPasswordInput } from '../types';

export function ForgotPasswordContainer() {
  useApplyTheme();
  const { resetPassword, isPending, error, isSuccess } = useResetPassword();

  function handleSubmit(data: ForgotPasswordInput): void {
    resetPassword(data.email);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <Link
          to="/login"
          className="mb-4 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &larr; Back to login
        </Link>
        <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            Reset Password
          </h1>
          <ForgotPasswordForm
            onSubmit={handleSubmit}
            isPending={isPending}
            error={error}
            isSuccess={isSuccess}
          />
        </div>
      </div>
    </div>
  );
}
