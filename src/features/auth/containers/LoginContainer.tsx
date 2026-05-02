import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '../hooks';
import { LoginForm } from '../components';
import { useApplyTheme } from '@/shared/hooks/use-apply-theme';
import type { LoginInput } from '../types';

export function LoginContainer() {
  useApplyTheme();
  const navigate = useNavigate();
  const { signIn, isPending, error } = useSignIn();

  async function handleSubmit(data: LoginInput): Promise<void> {
    try {
      await signIn(data.email, data.password);
      navigate('/app');
    } catch {
      // error is already set in the hook
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-4 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &larr; Back to home
        </Link>
        <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            TaskOps
          </h1>
          <LoginForm
            onSubmit={handleSubmit}
            isPending={isPending}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
