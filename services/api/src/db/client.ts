import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import type { AppConfig } from '../config/env';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

/**
 * Runs `fn` with a database client created for this request and closed afterwards.
 * Clients are never kept at module scope: a Worker isolate cannot share connections across
 * requests. Hyperdrive does the pooling.
 */
export async function withDb<T>(config: AppConfig, fn: (db: Database) => Promise<T>): Promise<T> {
  const client = postgres(config.databaseUrl, {
    max: 5,
    connect_timeout: 5,
    // Skips a type-lookup round trip on connect; add back only if custom array types need it.
    fetch_types: false,
  });
  try {
    return await fn(drizzle(client, { schema }));
  } finally {
    await client.end({ timeout: 5 }).catch(() => undefined);
  }
}
