# RideSphere

> Your cycling community. Your next adventure.

RideSphere helps cyclists across Southeast Asia find where to ride, who to ride with and which cycling trips are worth taking. It is a mobile-first app (iOS and Android) backed by an API that will later serve a public website and an admin console.

The name and branding are provisional, pending domain, trademark and app-store checks.

## Status

**Foundation plus the first feature: accounts.** The API is deployed to a staging environment on Cloudflare, members can sign up and sign in with email and password, and the mobile app has its five tabs with sign-in and a basic profile. The app has not been tested on a device yet. See the [feature matrix](docs/feature-matrix.md) for progress and [open decisions](docs/open-decisions.md) for what is blocking parts of the build.

## Architecture in brief

| Layer | Choice |
| --- | --- |
| Mobile | Expo + React Native + TypeScript + Expo Router |
| API | Hono on Cloudflare Workers, REST under `/api/v1`, OpenAPI |
| Database | Neon PostgreSQL + Drizzle ORM, reached through Cloudflare Hyperdrive |
| Media | Cloudflare R2 with presigned URLs |
| Auth | Better Auth, self-hosted on the API Worker |
| Background work | Cloudflare Cron Triggers and Queues |

Details: [architecture overview](docs/architecture/overview.md) and the [decision records](docs/architecture/decisions/).

## Repository layout

```
apps/mobile/        Expo app
services/api/       Cloudflare Worker (Hono), Drizzle schema and migrations
packages/shared/    Zod schemas and types safe for both client and server
packages/config/    Shared TypeScript and lint configuration
docs/               Product, architecture, security, privacy, runbooks
```

## Getting started

Prerequisites: Node.js 22 or later, and the [Neon CLI](https://neon.com/docs/reference/neon-cli) signed in to an account with access to the `ridesphere` project.

```sh
corepack enable          # puts the pinned pnpm on your PATH
pnpm install
```

### Database

Development uses the Neon `dev` branch, never `production`.

```sh
neon link --project-id wandering-darkness-13537447 --branch dev --no-env-pull
cp services/api/.env.example services/api/.env
cp services/api/.dev.vars.example services/api/.dev.vars   # then set BETTER_AUTH_SECRET
neon connection-string dev    # paste the result as both values in services/api/.env
pnpm --filter @ridesphere/api db:migrate
```

### API

```sh
pnpm --filter @ridesphere/api dev
curl http://localhost:8787/api/v1/health         # liveness
curl http://localhost:8787/api/v1/health/ready   # database reachable
curl http://localhost:8787/api/v1/openapi.json   # API specification
```

### Mobile app

```sh
cp apps/mobile/.env.example apps/mobile/.env     # set EXPO_PUBLIC_API_BASE_URL
pnpm --filter @ridesphere/mobile start
```

Open it in Expo Go on a phone or in an emulator. The simplest setup is to point the app at staging: set `EXPO_PUBLIC_API_BASE_URL=https://ridesphere-api-staging.amrin78.workers.dev`. Accounts work in the iOS and Android app only; the browser build is a layout preview.

To use a local API from a phone instead, the API URL must be your computer's LAN address, and the API must listen on it: `pnpm --filter @ridesphere/api dev --ip 0.0.0.0`.

### Checks

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

CI runs the same sequence on every pull request. API tests run inside the Workers runtime and do not need a database.

### Staging

The API is deployed to Cloudflare at <https://ridesphere-api-staging.amrin78.workers.dev> (try `/api/v1/health/ready`), backed by the Neon `staging` branch through Hyperdrive.

```sh
DATABASE_URL="$(neon connection-string staging)" pnpm --filter @ridesphere/api db:migrate   # schema first
pnpm --filter @ridesphere/api deploy:staging                                                 # needs `wrangler login`
```

To point the mobile app at staging, set `EXPO_PUBLIC_API_BASE_URL` to that URL.

### Google sign-in

The API offers Google sign-in once it has a Google OAuth client. In [Google Cloud Console](https://console.cloud.google.com/):

1. Create a project, then configure the OAuth consent screen (Google Auth Platform → Branding): app name, support email, audience **External**. While it is in testing, add each tester's Google address under **Audience → Test users**.
2. Under **Clients**, create an OAuth client of type **Web application**.
3. Add this authorised redirect URI for staging: `https://ridesphere-api-staging.amrin78.workers.dev/api/v1/auth/callback/google` (and `http://localhost:8787/api/v1/auth/callback/google` for local development).
4. Store the client ID and secret as Worker secrets. Do not put them in Git or in the mobile app:

```sh
cd services/api
pnpm exec wrangler secret put GOOGLE_CLIENT_ID --env staging
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET --env staging
```

For local development put the same two names in `services/api/.dev.vars`.

### Not set up yet

Production deployment, automated deploys from CI, EAS builds, and everything listed as blocked in the feature matrix.

## Documentation

| Document | Purpose |
| --- | --- |
| [Product spec](docs/product/product-spec.md) | Scope, audiences, data model, roadmap, budget, risks |
| [Original Claude Code prompt](docs/product/claude-code-prompt.md) | The founder's implementation brief, verbatim |
| [Architecture overview](docs/architecture/overview.md) | System design on Cloudflare and Neon |
| [Decision records](docs/architecture/decisions/) | Why significant choices were made |
| [Open decisions](docs/open-decisions.md) | Choices still owed by the owners |
| [Feature matrix](docs/feature-matrix.md) | What is built |
| [Threat model](docs/security/threat-model.md) | Abuse cases and mitigations |
| [Data inventory](docs/privacy/data-inventory.md) | Personal data held, why, and for how long |
| [Deployment and rollback](docs/runbooks/deployment-and-rollback.md) | Releasing the API and the database |
| [Backup and restore](docs/runbooks/backup-restore.md) | Recovering data |
| [Mobile release checklist](docs/release/mobile-release-checklist.md) | Shipping a store build |
| [CLAUDE.md](CLAUDE.md) | Working rules for Claude Code in this repository |
