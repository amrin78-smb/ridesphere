import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// Wrangler refuses to load a Hyperdrive binding without a local connection string. Tests mock
// the database client, so this placeholder is never dialled and a developer's real database is
// never touched. Tests that need Postgres get their own project later.
process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE =
  'postgres://test:test@127.0.0.1:1/test';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        // Stand in for what .dev.vars or `wrangler secret` provides elsewhere.
        bindings: {
          BETTER_AUTH_SECRET: 'test-only-secret-not-used-anywhere-else-0000',
          // Blank means unset. Keeps a developer's real .dev.vars credentials out of tests.
          GOOGLE_CLIENT_ID: '',
          GOOGLE_CLIENT_SECRET: '',
        },
      },
    }),
  ],
});
