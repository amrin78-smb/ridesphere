import { expoClient, getSetCookie, storageAdapter } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { apiBaseUrl } from '@/lib/config';

const STORAGE_PREFIX = 'ridesphere';

/**
 * Session handling is Better Auth's. The session is kept in the device's secure storage
 * (Keychain / Keystore), never in AsyncStorage.
 */
export const authClient = createAuthClient({
  // Screens check `isApiConfigured` before calling, so the placeholder is never contacted.
  baseURL: `${apiBaseUrl ?? 'http://not-configured.invalid'}/api/v1/auth`,
  plugins: [
    expoClient({
      scheme: 'ridesphere',
      storagePrefix: STORAGE_PREFIX,
      storage: SecureStore,
    }),
  ],
});

// --- Completing a browser sign-in from the return link -------------------------------------
//
// After Google sign-in the server sends the browser back to the app with the new session in
// the link. The Better Auth client normally catches that itself, but on Android the browser
// often reports "dismissed" before the link arrives, and the session is dropped. The link
// still opens the Profile screen, which hands it to `completeBrowserSignIn` below.

const storage = storageAdapter(SecureStore);
// Same key the Better Auth Expo client uses for its session cookie.
const COOKIE_KEY = `${STORAGE_PREFIX}_cookie`;
const PENDING_KEY = `${STORAGE_PREFIX}_browser_sign_in_started`;
const PENDING_WINDOW_MS = 10 * 60_000;

/** Call just before opening the browser for a social sign-in. */
export async function markBrowserSignInStarted() {
  await storage.setItemAsync(PENDING_KEY, String(Date.now()));
}

/**
 * Stores the session from a return link. Accepted only if this device started a browser
 * sign-in in the last few minutes: otherwise anyone could send a member a link that signs
 * them in to somebody else's account.
 */
export async function completeBrowserSignIn(cookie: string): Promise<boolean> {
  const startedAt = Number(await storage.getItemAsync(PENDING_KEY));
  await storage.setItemAsync(PENDING_KEY, '');
  if (!startedAt || Date.now() - startedAt > PENDING_WINDOW_MS) return false;

  const current = await storage.getItemAsync(COOKIE_KEY);
  await storage.setItemAsync(COOKIE_KEY, getSetCookie(cookie, current ?? undefined));
  authClient.$store.notify('$sessionSignal');
  return true;
}
