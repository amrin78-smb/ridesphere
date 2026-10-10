import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { apiBaseUrl } from '@/lib/config';

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
      storagePrefix: 'ridesphere',
      storage: SecureStore,
    }),
  ],
});
