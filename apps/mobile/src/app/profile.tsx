import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { Screen } from '@/components/screen';
import { StateView } from '@/components/state-view';
import { AuthForm } from '@/features/auth/auth-form';
import { ProfileView } from '@/features/profile/profile-view';
import { authClient, completeBrowserSignIn } from '@/lib/auth-client';
import { isApiConfigured } from '@/lib/config';

export default function ProfileScreen() {
  return (
    <Screen title="Profile" subtitle="Your riding preferences and account.">
      <ProfileContent />
    </Screen>
  );
}

function ProfileContent() {
  const session = authClient.useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { cookie } = useLocalSearchParams<{ cookie?: string }>();

  // Arriving here from the browser after Google sign-in: the session is in the link.
  useEffect(() => {
    if (!cookie) return;
    // Take the session out of the route straight away so it cannot be reused or shared.
    router.setParams({ cookie: undefined });
    void completeBrowserSignIn(cookie).then((accepted) => {
      if (accepted) void queryClient.invalidateQueries();
    });
  }, [cookie, router, queryClient]);

  if (Platform.OS === 'web') {
    // The API has no CORS policy or browser session handling yet; sign-in is for the apps.
    return (
      <StateView
        kind="empty"
        title="Sign in on the app"
        message="Accounts work in the iOS and Android app. The website comes later."
      />
    );
  }
  if (!isApiConfigured) {
    return (
      <StateView
        kind="error"
        title="Server not configured"
        message="Set EXPO_PUBLIC_API_BASE_URL in apps/mobile/.env and restart the app."
      />
    );
  }
  if (session.isPending) return <StateView kind="loading" title="Checking your session" />;
  return session.data ? <ProfileView /> : <AuthForm />;
}
