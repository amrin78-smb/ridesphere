# RideSphere

Cycling community, ride-discovery and trip app for Southeast Asia. Mobile first (iOS + Android); a public website and admin console follow later on the same API.

RideSphere is about social discovery and organising real-world rides and trips. It is not a Strava/Komoot replacement: no activity tracking, no navigation.

## Current state

Increments 1–3 are done and increment 4 (auth and profile) is partly done: monorepo, CI, API Worker deployed to staging, email-and-password sign-up/sign-in through Better Auth, `/api/v1/me`, and app screens for sign-in and basic profile. The app has not yet been run on a physical device. Still open in increment 4: Google and Apple sign-in (waiting on credentials), email verification and password reset (waiting on an email provider), account deletion, riding preferences. Launch market is Thailand (Asia/Bangkok, THB). Check `docs/feature-matrix.md` for what exists before assuming anything does.

## Where things are

| Path | What it is |
| --- | --- |
| `docs/product/product-spec.md` | Product spec, MVP scope, data model, roadmap (converted from the founder's proposal) |
| `docs/product/claude-code-prompt.md` | The original implementation prompt, verbatim, with a list of superseded items |
| `docs/architecture/overview.md` | How the system fits together on Cloudflare + Neon |
| `docs/architecture/decisions/` | ADRs. These win over the product spec where they differ |
| `docs/open-decisions.md` | Decisions that belong to the owner and are not yet made |
| `docs/feature-matrix.md` | Implemented / partial / deferred / not started — keep it current |
| `docs/security/threat-model.md`, `docs/privacy/data-inventory.md` | Update when adding endpoints, data fields or providers |
| `docs/runbooks/`, `docs/release/` | Deploy, rollback, backup/restore, mobile release checklist |

## Stack

- **Mobile** — Expo, React Native, TypeScript, Expo Router. TanStack Query for server state; React state by default, Zustand only for justified cross-screen client state. React Hook Form + Zod. Tokens in Expo SecureStore or the auth provider SDK, never AsyncStorage.
- **API** — Hono on Cloudflare Workers, REST under `/api/v1`, `@hono/zod-openapi` for validation and the OpenAPI spec. Modular monolith: one Worker.
- **Database** — Neon PostgreSQL, Drizzle ORM, versioned migrations via drizzle-kit. The Worker connects through Cloudflare Hyperdrive with the `postgres` (postgres.js) driver; use `withDb` from `services/api/src/db/client.ts`.
- **Media** — Cloudflare R2, presigned time-limited uploads and downloads.
- **Auth** — Better Auth, self-hosted on the API Worker with its tables in Neon (ADR-0005). All password, session and token handling goes through Better Auth; never hand-write any of it.
- **Monorepo** — pnpm workspaces: `apps/mobile`, `services/api`, `packages/shared`, `packages/config`.
- **Tests** — Vitest with `@cloudflare/vitest-plugin` for the API (tests run in workerd and mock the database client); Jest (`jest-expo`) + React Native Testing Library for mobile.

The spec proposes NestJS. That was replaced by Hono because the API deploys to Cloudflare Workers — see ADR-0002. Do not reintroduce NestJS, or add any new service or provider, without an ADR and the owner's agreement.

## Cloudflare Workers constraints

These shape most backend code, so keep them in mind:

- The runtime is workerd, not Node. `nodejs_compat` is on, but check a dependency actually runs on Workers before adding it. No filesystem, no long-lived process, no native modules.
- No global mutable state across requests, and no module-scope database clients. `withDb` creates the client per request from the Hyperdrive connection string.
- Config and secrets come from `env` bindings, not `process.env`. Validate them with a Zod schema once per isolate and fail with a clear error.
- Work after the response goes through `ctx.waitUntil`, a Queue or a Cron Trigger — never a dangling promise.
- Never buffer uploads through the Worker. Clients upload straight to R2 with a presigned URL; the Worker then inspects the stored object.
- Verify webhook signatures against the raw request body, using Web Crypto.
- Migrations run from CI or a developer machine against Neon's direct (non-pooled) connection string. The Worker never runs migrations.

## Commands

pnpm is pinned through `packageManager`; run `corepack enable` once so `pnpm` is on the PATH.

```
pnpm install
pnpm format | format:check | lint | typecheck | test | build   # whole workspace; CI runs these
pnpm --filter @ridesphere/api dev            # wrangler dev on :8787, needs services/api/.env
pnpm --filter @ridesphere/api test           # vitest inside workerd
pnpm --filter @ridesphere/api db:generate --name=<what_changed>   # after editing src/db/schema.ts
pnpm --filter @ridesphere/api db:migrate     # applies to DATABASE_URL in services/api/.env
pnpm --filter @ridesphere/api deploy:staging # after migrating the staging branch
pnpm --filter @ridesphere/mobile start       # expo; apps/mobile/.env points it at an API
pnpm --filter @ridesphere/mobile test        # jest
```

In `apps/mobile`, add packages with `pnpm exec expo install <pkg>` so versions match the Expo SDK, and read `apps/mobile/AGENTS.md` before touching Expo APIs.

## Deployed environments

- **Staging:** `https://ridesphere-api-staging.amrin78.workers.dev`, Neon `staging` branch through Hyperdrive `ridesphere-staging`. Deploy with `pnpm --filter @ridesphere/api deploy:staging` after migrating `staging`. Deploying to staging is routine; do it when an increment's checks pass.
- **Production:** does not exist yet. Creating it, or deploying to it, needs the owner's explicit go-ahead.

## Neon

- Project `ridesphere` (`wandering-darkness-13537447`), AWS Singapore. Branches: `production` (default, empty, no Worker yet), `staging` and `dev`.
- This directory is linked with the `neon` CLI and pinned to **`dev`**. `services/api/.env` holds the `dev` connection string. Keep it that way: never point local tooling at `production`.
- Migrations reach `production` only through the release flow in `docs/runbooks/deployment-and-rollback.md`.
- `neon.ts` is the Neon branch policy (currently empty). `neon config plan` previews, `neon deploy` applies.
- Neon agent skills are installed under `.claude/skills/`.

## Rules that are easy to get wrong

**Auth endpoints** (`/api/v1/auth/*`) belong to Better Auth and return its error shape, not the RideSphere envelope. Protect a route with `dbMiddleware` then `requireUser`; read the member from `c.get('user')`. After changing `src/auth/options.ts`, run `pnpm --filter @ridesphere/api auth:generate` and then `db:generate`.

**Authority lives on the server.** Every protected route checks the authenticated user and the resource-level permission. Hiding a button is not authorisation. Roles: visitor, member, organiser, club administrator, moderator, platform administrator. Nobody can grant themselves a role.

**RSVP capacity** is enforced in one database transaction with a row lock or an atomic conditional update, backed by a unique constraint on the active RSVP per user and ride. Never read a count and then insert.

**Payments** are not to be implemented until the owner picks the transaction type and gateway (`docs/open-decisions.md`). When they are: amounts computed server-side, hosted checkout, signed webhooks, provider event IDs stored with a unique constraint, idempotent processing. A client redirect is never proof of payment. Never store card data.

**Location privacy.** No live location, no background location, no home addresses. Member location is a broad, user-chosen area. Exact meeting instructions for private rides are withheld until the viewer is authorised.

**Time.** Store UTC timestamps plus the event's IANA timezone. Currency is explicit on every paid item.

**Uploads.** Do not trust client MIME types or filenames. Enforce size and content-type allowlists and ownership server-side. GPX access follows ride visibility.

**API shape.** Cursor pagination on anything that grows. One error envelope: stable `code`, safe `message`, `requestId`. Allowlisted sort and filter fields. Never return raw database rows, private contact details or moderation notes.

**Secrets** never go in Git or in the mobile bundle. Anything prefixed `EXPO_PUBLIC_` ships to users. Local Worker secrets live in `services/api/.dev.vars`, and local database URLs in `services/api/.env` (both gitignored); deployed ones are set with `wrangler secret put`. When reading env files, look at key names only.

**Logs** must not contain tokens, personal data or payment payloads.

**Seed data** is clearly synthetic and kept apart from production. Never fabricate ratings, booking counts, locations or successful operations in the UI.

## Out of scope for the MVP

Do not build these, even if they look like a natural extension: live location or GPS recording, turn-by-turn navigation, fitness analytics and leaderboards, activity sync, direct messaging, a peer-to-peer marketplace, multi-vendor payouts, AI features, offline navigation, multi-country tax automation, microservices, event streaming.

## How to work here

- Work in small, reviewable increments in this order: (1) repo audit and plan, (2) structure, conventions, env validation, CI, (3) schema, migrations, API skeleton, (4) auth and profile, (5) ride discovery and details, (6) ride publishing and RSVP, (7) clubs and organiser permissions, (8) community, reporting, moderation, (9) destinations and trips, (10) notifications and one commercial flow once approved, (11) QA, security review, release checklist.
- Do not generate the whole product in one pass. Implement only the planned increment.
- Do not assume provider accounts, API keys, Cloudflare or Neon resources, or app-store credentials exist. Ask, or build behind an adapter with a clear "not configured" state.
- Run lint, typecheck, tests and build for each increment and report the real results. Never say checks passed unless they ran and passed. No placeholder success responses, no security TODOs presented as done.
- Schema changes go through reviewed migrations. Worker rollbacks do not roll back the schema, so use expand-then-contract and avoid destructive changes in the same release as the code that stops using a column.
- With each increment, update whichever of these changed: README, `docs/feature-matrix.md`, OpenAPI spec, `.env.example`, threat model, data inventory, and add an ADR for any significant choice.
- Stop and ask before anything that costs money, risks data loss, creates a legal commitment or selects a provider.
- Branding is provisional (charcoal, off-white, vivid lime). Keep it in design tokens so it can change. Do not copy WeekendGravelCrew's or anyone else's logo, design, copy or assets.
