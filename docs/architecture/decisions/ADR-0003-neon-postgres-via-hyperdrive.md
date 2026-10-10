# ADR-0003: Neon PostgreSQL with Drizzle, connected through Hyperdrive

- Status: Accepted. Driver amended on 2026-10-10 (see Amendments); transaction spike still open
- Date: 2026-10-10

## Context

Neon PostgreSQL and Drizzle ORM are fixed by the proposal and the owner. What is open is how a Cloudflare Worker reaches the database. Workers cannot keep a connection pool alive between requests, and the RSVP and booking rules need real interactive transactions with row locks.

## Decision

- The Worker connects with a standard Postgres driver through **Cloudflare Hyperdrive**. Originally `pg`; now `postgres` (postgres.js) with Drizzle's postgres-js adapter, see Amendments.
- Hyperdrive is configured with Neon's direct connection string.
- A client is created per request from `env.HYPERDRIVE.connectionString`.
- Hyperdrive query caching is **off** to begin with. Stale reads of capacity, permissions or payment state are worse than a slower query. Turn it on later only for specific, clearly cacheable reads.
- Smart Placement is enabled on the Worker.
- Migrations are generated and applied with drizzle-kit over the direct connection string from CI or a developer machine.
- Neon branches provide development, preview and staging databases.

## Consequences

- Standard Postgres wire protocol and driver, so the same code runs against local Postgres in tests and nothing in the data layer is Neon-specific.
- Interactive transactions and `SELECT … FOR UPDATE` are available.
- Hyperdrive pools in transaction mode, so session-level features (session advisory locks, `SET` outside a transaction, `LISTEN/NOTIFY`) must not be relied on.
- One more Cloudflare resource to configure per environment.

## To validate in the spike

1. A transaction with a row lock behaves correctly under concurrent requests through Hyperdrive.
2. Local development and `vitest-pool-workers` tests can reach a local or branch database.
3. Latency from the chosen Worker placement to the chosen Neon region is acceptable.
4. Behaviour when Neon compute has scaled to zero.

If any of these fail, the fallback is Neon's serverless driver (`@neondatabase/serverless`) over WebSockets, recorded as a superseding ADR.

## Amendments

**2026-10-10 — driver changed from `pg` to `postgres` (postgres.js).** `pg` is CommonJS with runtime-conditional requires, and its `pg-protocol` dependency failed to load inside the Workers test runtime (`@cloudflare/vitest-plugin`). postgres.js is ESM, ships a Workers build and is equally supported by Hyperdrive and Drizzle. Everything else in this decision is unchanged.

**2026-10-10 — what has been verified so far.** A query from the Worker through Wrangler's local Hyperdrive emulation reaches the Neon `dev` branch in Singapore (readiness endpoint returns 200). Spike item 2 is settled differently than planned: API tests mock the database client, and tests that need Postgres are still to be designed. Items 1, 3 and 4 were open at this point.

**2026-10-10 — staging.** The staging Worker reaches the Neon `staging` branch through a real Hyperdrive configuration with caching disabled; the readiness endpoint answered in roughly 0.3 s from Thailand. That is one measurement, not a latency study. Item 1 (row lock under concurrency) and item 4 (scale-to-zero behaviour) remain open.

## Alternatives considered

- **Neon serverless driver, HTTP mode.** Simple and fast for single statements, but no interactive transactions.
- **Neon serverless driver, WebSocket mode.** Supports transactions and is the fallback. Neon-specific, and awkward against a plain local Postgres.
- **Cloudflare D1.** SQLite, not PostgreSQL; rejected by the requirement for Neon.
