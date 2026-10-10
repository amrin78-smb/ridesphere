# Backup and restore

Status: draft procedure written before any database exists. It is not verified. A restore drill must be completed and dated in the log below before public launch (release gate E).

Owner: technical founder.

## Recovery targets

To be agreed with the business owner (open decision 14):

| Target | Value |
| --- | --- |
| Acceptable data loss (RPO) | Not set |
| Acceptable downtime (RTO) | Not set |

The targets determine which Neon plan is needed, because the point-in-time restore window depends on the plan. The `ridesphere` project currently has **6 hours** of history retention (checked 2026-10-10). A mistake noticed after 6 hours cannot be undone with point-in-time restore, which makes the independent dump below essential before launch.

## What is backed up, and how

| Data | Primary protection | Independent copy |
| --- | --- | --- |
| PostgreSQL (Neon) | Neon point-in-time restore within the plan's history window | Scheduled `pg_dump`, encrypted, stored outside the Neon account |
| Media (R2) | R2 durability | To be decided: bucket versioning or periodic copy to a second bucket |
| Schema | Migrations in Git | Git remote |
| Worker code and config | Git, Cloudflare version history | Git remote |
| Secrets | Not backed up in the repository | Founders' password manager |

Point-in-time restore covers mistakes inside the history window. It does not cover losing access to the Neon account, or a problem noticed after the window has passed. The independent dump covers those.

### Logical dump

- Runs on a schedule from CI, using the direct connection string.
- `pg_dump` in custom format, encrypted before upload, stored in a dedicated private bucket with a lifecycle rule.
- The job fails loudly; a silent backup failure is the usual way backups turn out not to exist.
- Dumps contain personal data. Access is restricted, and retention must match the deletion promises in the [data inventory](../privacy/data-inventory.md).

## Restore procedures

### A. Bad data change or bad migration, noticed quickly

1. Stop the damage: roll back the Worker or disable the feature.
2. Note the last known-good time in UTC.
3. In Neon, create a **new branch** from the production branch at that time. Do not overwrite production yet.
4. Connect to the new branch and check that the data looks right.
5. Choose:
   - **Selective repair** (preferred): copy the affected rows from the restored branch back into production.
   - **Full restore**: restore the production branch to that time, or repoint Hyperdrive at the restored branch. Everything written after that time is lost.
6. If Hyperdrive was repointed, deploy and confirm the health endpoint.
7. If payments are live, reconcile bookings against the gateway for the lost interval.
8. Tell affected organisers and members if RSVPs or bookings were lost.

### B. Neon project lost or inaccessible

1. Create a new Neon project in the intended region.
2. Fetch and decrypt the most recent dump.
3. `pg_restore` into the new database.
4. Check the migration state matches the deployed Worker; apply pending migrations if needed.
5. Update the Hyperdrive configuration and the CI `DATABASE_URL`, then deploy.
6. Run smoke tests. Data since the dump is lost; reconcile payments as above.

### C. Media object lost

1. Restore from versioning or the copy bucket, if that has been set up.
2. Otherwise mark the `media_assets` row as missing so the app shows a placeholder, and ask the owner to upload again.

### D. Restoring one member's data

Use procedure A with selective repair. Do not do a full restore for a single account.

## Restore drill

Run before launch and at least twice a year.

1. Create a Neon branch from production at a point one hour earlier.
2. Restore the latest dump into a scratch database.
3. For both: run migration status, compare row counts for core tables, and run the API test suite's read checks against them.
4. Time each step and compare with the recovery targets.
5. Delete the scratch branch and database.
6. Record the result below.

| Date | Who | Method | Time taken | Result | Follow-up |
| --- | --- | --- | --- | --- | --- |
| | | | | No drill has been run yet | |
