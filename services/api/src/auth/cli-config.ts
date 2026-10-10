// Used only by `pnpm auth:generate` to produce src/db/auth-schema.ts. Never imported by the Worker.
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { authOptions } from './options';

export const auth = betterAuth({
  ...authOptions({
    secret: 'schema-generation-only-not-a-real-secret',
    baseUrl: 'http://localhost',
  }),
  database: drizzleAdapter({}, { provider: 'pg' }),
});
