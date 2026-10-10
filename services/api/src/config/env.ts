import { appEnvSchema } from '@ridesphere/shared';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';

import type { AuthSecrets } from '../auth/options';
import { AppError } from '../common/errors';
import { log } from '../common/logger';
import type { AppBindings } from '../common/types';

const optionalSecret = z.string().min(1).optional();

// Every name here must also be described in the root .env.example.
const configSchema = z.object({
  APP_ENV: appEnvSchema,
  HYPERDRIVE: z.object({ connectionString: z.string().min(1) }),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: optionalSecret,
  GOOGLE_CLIENT_SECRET: optionalSecret,
});

export type AppConfig = {
  appEnv: z.infer<typeof appEnvSchema>;
  databaseUrl: string;
  auth: AuthSecrets;
};

export function parseConfig(env: unknown): AppConfig {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    // Names only. Values may be secrets and must never reach logs.
    const invalid = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    log('error', 'invalid environment configuration', { invalid: invalid.join(',') });
    throw new AppError(500, 'SERVICE_MISCONFIGURED', 'The service is not configured correctly.');
  }
  const e = result.data;
  return {
    appEnv: e.APP_ENV,
    databaseUrl: e.HYPERDRIVE.connectionString,
    auth: {
      secret: e.BETTER_AUTH_SECRET,
      baseUrl: e.BETTER_AUTH_URL,
      allowExpoGo: e.APP_ENV !== 'production',
      // Google sign-in is offered only when both credentials are present.
      google:
        e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET
          ? { clientId: e.GOOGLE_CLIENT_ID, clientSecret: e.GOOGLE_CLIENT_SECRET }
          : undefined,
    },
  };
}

// Workers have no startup phase with bindings available, so configuration is validated on
// first use and cached for the life of the isolate. Bindings do not change within an isolate.
let cached: AppConfig | undefined;

export const configMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  cached ??= parseConfig(c.env);
  c.set('config', cached);
  await next();
});
