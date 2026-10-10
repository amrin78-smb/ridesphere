import { expo } from '@better-auth/expo';
import type { BetterAuthOptions } from 'better-auth';

export type AuthSecrets = {
  secret: string;
  baseUrl: string;
  /** Accept the Expo Go development client. Never true in production. */
  allowExpoGo: boolean;
  google?: { clientId: string; clientSecret: string } | undefined;
};

export const AUTH_BASE_PATH = '/api/v1/auth';

/**
 * Better Auth configuration without the database adapter, so the same options drive both the
 * Worker and schema generation. All password, session and token handling stays inside
 * Better Auth (ADR-0005): do not add hand-written hashing or token code here.
 */
export function authOptions(secrets: AuthSecrets) {
  return {
    appName: 'RideSphere',
    baseURL: secrets.baseUrl,
    basePath: AUTH_BASE_PATH,
    secret: secrets.secret,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
    },
    socialProviders: {
      ...(secrets.google ? { google: secrets.google } : {}),
    },
    // Deep-link scheme of the mobile app. Requests from any other origin are refused.
    // Expo Go identifies itself as exp://, so it is accepted outside production only.
    trustedOrigins: ['ridesphere://', ...(secrets.allowExpoGo ? ['exp://', 'exp://**'] : [])],
    rateLimit: {
      enabled: true,
      // Isolates do not share memory, so counters live in Postgres.
      storage: 'database',
      window: 60,
      max: 60,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 3600, max: 5 },
      },
    },
    advanced: {
      database: { generateId: 'uuid' },
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
    },
    plugins: [expo()],
  } satisfies BetterAuthOptions;
}
