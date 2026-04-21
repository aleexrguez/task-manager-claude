import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppPreferencesStore } from '@/shared/store/app-preferences.store';
import { useAuth, useSignOut } from '@/features/auth/hooks';
import { SettingsPage } from '../components/SettingsPage';

export function SettingsContainer() {
  const theme = useAppPreferencesStore((s) => s.theme);
  const setTheme = useAppPreferencesStore((s) => s.setTheme);
  const retentionPolicy = useAppPreferencesStore((s) => s.retentionPolicy);
  const setRetentionPolicy = useAppPreferencesStore(
    (s) => s.setRetentionPolicy,
  );

  const remindersEnabled = useAppPreferencesStore((s) => s.remindersEnabled);
  const toggleReminders = useAppPreferencesStore((s) => s.toggleReminders);

  const { user } = useAuth();
  const { signOut, isPending: isSigningOut } = useSignOut();

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    queryClient.clear();
    navigate('/');
  }

  return (
    <SettingsPage
      theme={theme}
      onThemeChange={setTheme}
      retentionPolicy={retentionPolicy}
      onRetentionPolicyChange={setRetentionPolicy}
      userEmail={user?.email ?? ''}
      onSignOut={handleSignOut}
      isSigningOut={isSigningOut}
      remindersEnabled={remindersEnabled}
      onToggleReminders={toggleReminders}
    />
  );
}
