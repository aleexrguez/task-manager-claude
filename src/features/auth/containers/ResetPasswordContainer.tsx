import { useUpdatePassword } from '../hooks';
import { ResetPasswordForm } from '../components';
import { useApplyTheme } from '@/shared/hooks/use-apply-theme';
import type { ResetPasswordInput } from '../types';

export function ResetPasswordContainer() {
  useApplyTheme();
  const { updatePassword, isPending, error, isSuccess } = useUpdatePassword();

  function handleSubmit(data: ResetPasswordInput): void {
    updatePassword(data.password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            Set New Password
          </h1>
          <ResetPasswordForm
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
