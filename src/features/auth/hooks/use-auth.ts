import { useContext, useState } from 'react';
import { AuthContext } from '@/providers/auth-context';
import type { AuthContextValue } from '@/providers/auth-context';
import {
  signIn,
  signUp,
  signOut,
  resetPasswordForEmail,
  updatePassword,
} from '../api';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function useSignIn() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(email: string, password: string): Promise<void> {
    setIsPending(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setIsPending(false);
    }
  }

  return { signIn: handleSignIn, isPending, error };
}

export function useSignUp() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(email: string, password: string): Promise<void> {
    setIsPending(true);
    setError(null);
    try {
      await signUp(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setIsPending(false);
    }
  }

  return { signUp: handleSignUp, isPending, error };
}

export function useSignOut() {
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut(): Promise<void> {
    setIsPending(true);
    try {
      await signOut();
    } finally {
      setIsPending(false);
    }
  }

  return { signOut: handleSignOut, isPending };
}

export function useResetPassword() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleReset(email: string): Promise<void> {
    setIsPending(true);
    setError(null);
    try {
      await resetPasswordForEmail(email);
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send reset email',
      );
    } finally {
      setIsPending(false);
    }
  }

  return { resetPassword: handleReset, isPending, error, isSuccess };
}

export function useUpdatePassword() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleUpdate(password: string): Promise<void> {
    setIsPending(true);
    setError(null);
    try {
      await updatePassword(password);
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update password',
      );
    } finally {
      setIsPending(false);
    }
  }

  return { updatePassword: handleUpdate, isPending, error, isSuccess };
}
