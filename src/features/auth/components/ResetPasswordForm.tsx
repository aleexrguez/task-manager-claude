import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { resetPasswordInputSchema } from '../types';
import type { ResetPasswordInput } from '../types';

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordInput) => void;
  isPending: boolean;
  error: string | null;
  isSuccess: boolean;
}

interface FormState {
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

export function ResetPasswordForm({
  onSubmit,
  isPending,
  error,
  isSuccess,
}: ResetPasswordFormProps) {
  const [fields, setFields] = useState<FormState>({
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';

  const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const result = resetPasswordInputSchema.safeParse(fields);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onSubmit(result.data);
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Password updated successfully
          </p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            You can now sign in with your new password.
          </p>
        </div>
        <Link
          to="/login"
          className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Enter your new password below.
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
        <label htmlFor="password" className={labelClass}>
          New Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            value={fields.password}
            onChange={handleChange}
            className={`${inputClass} w-full pr-10`}
            placeholder="••••••"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <img
              src={showPassword ? '/HidePassword.png' : '/ShowPassword.png'}
              alt=""
              className="h-5 w-5"
            />
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            minLength={6}
            value={fields.confirmPassword}
            onChange={handleChange}
            className={`${inputClass} w-full pr-10`}
            placeholder="••••••"
          />
          <button
            type="button"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <img
              src={
                showConfirmPassword ? '/HidePassword.png' : '/ShowPassword.png'
              }
              alt=""
              className="h-5 w-5"
            />
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        {isPending ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}
