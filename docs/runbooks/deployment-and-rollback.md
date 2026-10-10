# Deployment and rollback

Status: draft. Staging has been deployed by hand once (2026-10-10) with the commands in the README; production and CI-driven deploys do not exist yet, so the production steps below are still the intended shape rather than a tested procedure. Mark this runbook as verified only after a rollback has been rehearsed in staging.

Owner: technical founder.

## What gets deployed

| Unit | Platform | How |
| --- | --- | --- |
| API | Cloudflare Workers | Wrangler, from CI |
| Database schema | Neon PostgreSQL | drizzle-kit migrations, from CI |
| Mobile app | App Store, Google Play | EAS Build and Submit; see the [mobile release checklist](../release/mobile-release-checklist.md) |

The API and the mobile app release independently. Old app versions stay in use for weeks after a release, so the API must remain compatible with them.

## One-time setup per environment

- Worker environment in `wrangler.jsonc` (`staging`, `production`)
- Hyperdrive configuration pointing at that environment's Neon database
- R2 bucket and its S3 API token
- Rate limiting binding, Cron Triggers, Queues as used
- Secrets set with `wrangler secret put <NAME> --env <environment>`
- Custom domain and route
- A Cloudflare API token scoped to this account's Workers, stored as a CI secret
- Budget and usage alerts in Cloudflare and Neon

## Release flow

1. Pull request: format, lint, typecheck, tests, build and bundle-size check must pass.
2. Merge to `main` deploys to **staging**: apply migrations to the staging database, then deploy the Worker.
3. Verify staging: health endpoint, smoke tests, and the journeys touched by the change.
4. Promote to **production** by a manual approval in CI: apply migrations, then deploy the Worker.
5. Watch error rate and latency for 15 minutes. Check the health endpoint and one read and one write journey.

Migrations always run before the Worker that needs them.

```
# shape of the commands; confirm against the real scripts
pnpm --filter api db:migrate               # DATABASE_URL = direct connection for the target
pnpm --filter api exec wrangler deploy --env production
```

For risky changes, use a gradual deployment: upload a new version and shift a percentage of traffic to it before going to 100%.

## Migration rules

Rolling back the Worker does not roll back the schema. So:

- Every migration must work with both the current and the previous Worker version.
- Use expand then contract. Release 1 adds the new column or table. Release 2 uses it. A later release removes the old one.
- Never drop or rename a column in the same release that stops using it.
- Adding a `NOT NULL` column needs a default or a backfill first.
- Build indexes on large tables concurrently.
- Anything destructive needs a written rollout note in the pull request and a Neon restore point taken just before.

## Rolling back the API

Use when a release raises errors or breaks a journey.

1. Roll back to the previous Worker version:
   ```
   pnpm --filter api exec wrangler rollback --env production
   ```
   or select the earlier version in the Cloudflare dashboard.
2. Confirm the health endpoint and the broken journey.
3. Remember that secrets and bindings are not reverted by this. If the release changed them, restore them by hand.
4. Leave the schema alone. Because migrations are backwards compatible, the previous Worker runs against the new schema.
5. Record what happened and open a fix.

## Rolling back the database

This is the last resort, and it loses data written since the restore point.

1. Prefer a forward fix: a new migration that corrects the problem.
2. If data is damaged, follow [backup and restore](backup-restore.md).
3. If payments are live, reconcile against the gateway after any restore, because webhooks processed after the restore point will be missing.

## Rolling back the mobile app

Store releases cannot be withdrawn from devices.

- Stop a phased rollout in the store console.
- Fix forward with an expedited build.
- Use a server-side flag to switch off a broken feature.
- Use the API's minimum supported version check to force an upgrade if a build is dangerous.
- If over-the-air updates are adopted, they may carry JavaScript-only fixes within store rules.

## Secret rotation

1. Create the new credential at the provider.
2. `wrangler secret put` for each environment; this deploys a new version.
3. Verify, then revoke the old credential.
4. Rotate immediately if a secret appears in Git, logs or a screenshot.

## After an incident

Write a short note: what happened, impact, timeline, cause, what changes. Keep these in `docs/runbooks/incidents/`.
