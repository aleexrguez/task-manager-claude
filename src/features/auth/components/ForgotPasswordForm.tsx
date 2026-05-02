import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordInputSchema } from '../types';
import type { ForgotPasswordInput } from '../types';

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordInput) => void;
  isPending: boolean;
  error: string | null;
  isSuccess: boolean;
}

export function ForgotPasswordForm({
  onSubmit,
  isPending,
  error,
  isSuccess,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();

  const inputClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';

  const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    setEmail(e.target.value);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const result = forgotPasswordInputSchema.safeParse({ email });
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    onSubmit(result.data);
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Check your email
          </p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            If an account exists for that email, we sent a password reset link.
          </p>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20"
        >
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClass}>
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={handleChange}
          className={inputClass}
          placeholder="you@example.com"
        />
        {fieldError && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        {isPending ? 'Sending...' : 'Send Reset Link'}
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        <Link
          to="/login"
          className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Back to login
        </Link>
      </p>
    </form>
  );
}
