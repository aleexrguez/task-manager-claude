import { supabase } from './supabase';

export async function requireAuthenticatedUser(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Not authenticated');
  }

  return user.id;
}
