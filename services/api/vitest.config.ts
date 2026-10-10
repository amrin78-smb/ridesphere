import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// Wrangler refuses to load a Hyperdrive binding without a local connection string. Tests mock
// the database client, so this placeholder is never dialled and a developer's real database is
// never touched. Tests that need Postgres get their own project later.
process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE =
  'postgres://test:test@127.0.0.1:1/test';

export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' } })],
});
