import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import type { AppConfig } from '../config/env';
import type { Database } from '../db/client';
import * as schema from '../db/schema';
import { authOptions } from './options';

/** Builds the Better Auth instance for one request, bound to that request's database client. */
export function createAuth(config: AppConfig, db: Database) {
  return betterAuth({
    ...authOptions(config.auth),
    database: drizzleAdapter(db, { provider: 'pg', schema }),
  });
}

export type Auth = ReturnType<typeof createAuth>;
