# Open decisions

Choices that belong to the owners and are not yet made. Each one blocks the work listed against it. When a decision is made, record it here with the date, and add an ADR if it is architectural.

| # | Decision | Recommended default | Blocks | Status |
| --- | --- | --- | --- | --- |
| 2 | Launch city within Thailand | One city first | Seed data, partners, launch content | Country decided; city open |
| 5 | Maps provider | Decide after a pricing and regional coverage review | Map previews (increment 5); the app ships a fallback state until then | Open |
| 6 | RSVP waitlist in the MVP or deferred | Defer unless launch organisers ask for it | RSVP rules (increment 6) | Open |
| 7 | Trip business role: listing/enquiry or booking intermediary | Start with discovery and enquiry | Trips (increment 9), terms of service | Open |
| 8 | First paid transaction: event registration or trip deposit | Decide after organiser interviews | All payment work (increment 10) | Open |
| 9 | Payment gateway | Chosen after decision 8, for the launch country | All payment work | Open |
| 10 | Email provider | Any transactional provider with an HTTP API | Email notifications | Open |
| 11 | Launch languages | English first, strings translation-ready | Localisation effort | Open |
| 12 | Admin interface | Admin API first, minimal web console behind Cloudflare Access next | Moderation operations | Open |
| 13 | Account deletion and data retention policy | See proposals in the [data inventory](privacy/data-inventory.md) | Account deletion, privacy policy | Open |
| 14 | Recovery targets: acceptable data loss and downtime | Set with the Neon plan in hand | [Backup runbook](runbooks/backup-restore.md) | Open |
| 15 | Supported iOS and Android versions | Current and previous major versions | Device test matrix | Open |
| 16 | Founder agreement | Sign before meaningful build investment | Not a technical blocker | Open |
| 17 | Brand name clearance | Check domain, handles, store names, trademarks | Store listing, bundle identifier | Open |

## Decided

| Date | Decision | Record |
| --- | --- | --- |
| 2026-10-10 | Deploy the API on Cloudflare Workers with Neon PostgreSQL | Owner instruction; ADR-0002, ADR-0003 |
| 2026-10-10 | Media on Cloudflare R2 | ADR-0004 |
| 2026-10-10 | Hono for the API, replacing NestJS (was decision 1) | Owner; ADR-0002 |
| 2026-10-10 | Launch market is Thailand: Asia/Bangkok, THB (part of decision 2) | Owner |
| 2026-10-10 | Authentication with self-hosted Better Auth (was decision 3) | Owner; ADR-0005 |
| 2026-10-10 | Neon region: AWS Singapore (ap-southeast-1), nearest to Thailand, subject to privacy advice (was decision 4) | Owner |
| 2026-10-10 | Development database is a Neon dev branch supplied by the owner | Owner |
