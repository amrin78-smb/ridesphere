import { defineConfig } from 'drizzle-kit';

// Migrations run from a laptop or CI, never from the Worker. DATABASE_URL must be the
// Neon DIRECT (non-pooled) connection string of the branch being migrated.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: rely on the process environment (CI).
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
});
