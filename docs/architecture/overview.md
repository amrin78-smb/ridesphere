# Architecture overview

Status: design, not yet implemented. This describes the intended system; the [feature matrix](../feature-matrix.md) says what actually exists.

## Shape of the system

```
 Expo app (iOS / Android)            Future website + admin console
          │                                      │
          └──────────── HTTPS, JWT ──────────────┘
                              │
                 ┌────────────▼────────────┐
                 │  API Worker (Hono)      │  Cloudflare Workers
                 │  /api/v1, OpenAPI       │
                 │  modular monolith       │
                 └──┬───────┬────────┬─────┘
        Hyperdrive  │       │ R2     │ Cron / Queues
                 ┌──▼──┐ ┌──▼───┐ ┌──▼──────────────┐
                 │Neon │ │Media │ │Outbox, reminders│
                 │ PG  │ │bucket│ │notifications    │
                 └─────┘ └──────┘ └─────────────────┘

 External: maps · email · Expo push · payments (later)
```

One Worker serves the whole API. It is a modular monolith: no microservices, no event streaming.

## Components

| Component | Technology | Notes |
| --- | --- | --- |
| Mobile app | Expo, React Native, Expo Router | No secrets, no authoritative permission checks, no payment verification |
| API | Hono on Cloudflare Workers | See [ADR-0002](decisions/ADR-0002-api-on-cloudflare-workers-with-hono.md) |
| Database | Neon PostgreSQL, Drizzle ORM | See [ADR-0003](decisions/ADR-0003-neon-postgres-via-hyperdrive.md) |
| Media | Cloudflare R2 | See [ADR-0004](decisions/ADR-0004-media-on-cloudflare-r2.md) |
| Identity | Better Auth, self-hosted on the API Worker | See [ADR-0005](decisions/ADR-0005-authentication-provider.md) |
| Background work | Cron Triggers, Queues | Notification outbox, ride reminders, cleanup of abandoned uploads |
| Rate limiting | Workers Rate Limiting binding | Durable Objects only if a limit must be exact |
| Observability | Workers Logs, Sentry | Structured JSON logs with a request ID |
| Admin console | Later: static web app on Workers | Put Cloudflare Access in front of it, in addition to in-app roles |

## API structure

```
services/api/src/
  index.ts            Worker entry: fetch, scheduled, queue handlers
  app.ts              Hono app, middleware order, route mounting
  modules/
    auth/  users/  clubs/  rides/  rsvps/  trips/
    community/  media/  payments/  notifications/  admin/
      routes.ts       OpenAPI route definitions and handlers
      service.ts      Domain rules; the only place that touches this module's tables
      schemas.ts      Zod request/response schemas
  common/             Auth middleware, permissions, errors, pagination, logging
  db/                 Drizzle schema, client factory, migrations
  config/             Env binding schema
```

Rules:

- Handlers validate and translate. Domain rules live in services.
- A module does not query another module's tables directly; it calls that module's service.
- Request and response schemas shared with the mobile app live in `packages/shared`. That package must stay free of server-only imports so it cannot drag them into the mobile bundle.

Middleware order: request ID → logging → CORS and security headers → rate limit → auth (validate session, load internal user, reject suspended accounts) → route-level permission check → handler → error mapping.

### Error envelope

```json
{ "error": { "code": "RIDE_FULL", "message": "This ride is full.", "requestId": "…" } }
```

`code` is stable and machine-readable. `message` is safe to show. Internal detail goes to logs only.

## Database access from a Worker

Workers cannot hold a connection pool between requests, so the Worker connects to Neon through Hyperdrive, which pools connections close to the database.

- Create a Drizzle client per request from `env.HYPERDRIVE.connectionString`. Never at module scope.
- Hyperdrive is given Neon's **direct** connection string. It does its own pooling; stacking it on Neon's pooler is unnecessary.
- Interactive transactions work, which the RSVP and booking rules depend on.
- Enable Smart Placement so the Worker runs near the database rather than near the user, since most requests make several queries.
- Migrations and seeds run with drizzle-kit from CI or a laptop over the direct connection string. The Worker has no migration code path.

### RSVP capacity

The transaction locks the ride row (`SELECT … FOR UPDATE`), counts confirmed RSVPs, then inserts as confirmed, or as waitlisted or rejected depending on the waitlist decision. A partial unique index on `(ride_id, user_id)` for active statuses stops duplicates even if application logic is wrong. An integration test fires concurrent joins at a ride with one place left and asserts exactly one succeeds.

## Media flow

1. Client asks `POST /api/v1/media/upload-intents` with purpose, declared type and size.
2. API checks permission and limits, creates a `media_assets` row in `pending`, returns a short-lived presigned R2 PUT URL bound to a server-generated key.
3. Client uploads straight to R2.
4. Client confirms. The API reads the object's real size and leading bytes from R2, validates them against the allowlist for that purpose, and marks the asset `ready` or deletes it.
5. Downloads use short-lived presigned GET URLs issued after a visibility check. The bucket has no public access.

GPX files are parsed with a streaming or size-capped XML parser that does not resolve external entities. A Cron Trigger removes `pending` assets that were never confirmed.

## Configuration and secrets

Workers have no startup phase where environment can be checked, and bindings arrive with the first request. The env schema (Zod) is therefore validated once per isolate on first use, and a failure returns a clear 500 with a logged list of missing names, never values. Keeping `.env.example` in step with the schema is a manual rule for now; an automated check is still to be added.

- Non-secret configuration and bindings: `wrangler.jsonc`, per environment.
- Secrets: `wrangler secret put`. Local: Worker secrets in `services/api/.dev.vars`, database URLs in `services/api/.env`, both gitignored.
- Mobile: only `EXPO_PUBLIC_*` publishable values. Anything in the app bundle is public.

## Environments

| Environment | Worker | Database | Media | Payments |
| --- | --- | --- | --- | --- |
| Local | `wrangler dev` | Neon dev branch or local Postgres | Local R2 simulation | None or sandbox |
| Preview | Per-branch preview deployment | Short-lived Neon branch | Preview bucket | Sandbox |
| Staging | `--env staging` | Separate Neon branch or project, own credentials | Staging bucket | Sandbox |
| Production | `--env production` | Production Neon project | Production bucket | Live, once approved |

Production data is never copied into lower environments. Choose the Neon region once, with the launch market and privacy advice in mind, because moving later means a migration.

## Notifications

In-app notifications are rows in Postgres. Email and push go through an outbox table written in the same transaction as the triggering change, drained by a Cron Trigger (move to Queues if volume or latency needs it). A send is recorded as delivered only when the provider accepted it; failures are retried with a cap and stay visible.

## Platform limits to design around

Verify current numbers in Cloudflare's and Neon's documentation for the plan in use; they change.

- CPU time per request is bounded. Keep image processing and large file parsing out of the request path.
- Worker bundle size is bounded. Watch dependencies; check size in CI.
- Memory per isolate is bounded. Stream, do not buffer, anything large.
- Subrequests per request are bounded. Avoid N+1 patterns against external APIs.
- Neon compute can scale to zero on some plans, which adds a cold-start delay to the first query. Decide per environment whether that is acceptable.

## What is deliberately absent

Live location, navigation, activity tracking, direct messaging, recommendation engines, marketplace settlement and anything AI. See the MVP exclusions in the [product spec](../product/product-spec.md).
