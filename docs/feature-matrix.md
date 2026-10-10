# Feature matrix

Status values: **Implemented** (built, tested, in staging), **Partial** (say what is missing), **Deferred** (deliberately later), **Not started**, **Blocked** (name the open decision).

Update this in the same change that alters a feature's status. Do not mark something Implemented while it has placeholder responses or untested security rules.

Last reviewed: 2026-10-10. Foundation only. The API is deployed to staging; production does not exist yet.

## Foundation

| Item | Status | Notes |
| --- | --- | --- |
| Monorepo, lint, format, typecheck | Implemented | pnpm workspaces |
| CI workflow | Implemented | Passing on GitHub. No bundle-size check yet |
| API Worker skeleton, health and readiness endpoints, error envelope, request IDs, structured logs | Partial | Deployed to staging at `https://ridesphere-api-staging.amrin78.workers.dev`. No CORS, rate limiting or auth yet |
| Env binding validation | Implemented | Validated once per isolate; covers `APP_ENV` and `HYPERDRIVE` only so far |
| Drizzle schema and first migration | Partial | `clubs` table only, applied to Neon `dev` and `staging` |
| Hyperdrive connectivity | Partial | Staging Worker reaches Neon `staging` through Hyperdrive (readiness 200, about 0.3 s). The row-lock transaction spike in ADR-0003 is still to do |
| OpenAPI document | Implemented | Generated at `/api/v1/openapi.json`; health routes only |
| Mobile app shell, tabs, design tokens | Partial | Five tabs, tokens, loading/empty/error component, API client. Bundles for iOS and Android and renders on web; not yet run on a physical device or simulator. Icons and splash are Expo placeholders |
| Synthetic seed data | Not started | |
| Staging deployment | Partial | Deployed by hand with `pnpm --filter @ridesphere/api deploy:staging`; not yet automated from CI |
| Production deployment | Not started | No production Hyperdrive configuration or Worker |

## MVP features

| Area | Feature | Status | Notes |
| --- | --- | --- | --- |
| A. Auth | Register, login, logout, session restore | Not started | Better Auth, ADR-0005 |
| A. Auth | Email verification and password recovery | Blocked | Open decision 10 (email provider) |
| A. Auth | Account deletion | Blocked | Open decision 13 |
| B. Profile | Profile and riding preferences | Not started | |
| B. Profile | Profile visibility controls | Not started | |
| C. Discovery | Ride list with cursor pagination | Not started | |
| C. Discovery | Search and filters | Not started | |
| D. Ride detail | Detail screen and route summary | Not started | |
| D. Ride detail | GPX upload, validation, download | Not started | |
| D. Ride detail | Map preview with fallback | Blocked | Open decision 5; fallback state can be built first |
| E. Participation | RSVP and cancel, duplicate prevention | Not started | |
| E. Participation | Transactional capacity enforcement | Not started | |
| E. Participation | Waitlist | Blocked | Open decision 6 |
| E. Participation | Meeting point hidden until authorised | Not started | |
| F. Clubs | Club profile and upcoming rides | Not started | |
| F. Clubs | Membership and roles | Not started | |
| F. Clubs | Organiser ride publishing | Not started | |
| G. Community | Posts, comments, reactions | Not started | |
| G. Community | Report and block | Not started | |
| H. Trips | Destinations and trip pages | Not started | |
| H. Trips | Trip enquiry | Blocked | Open decision 7 |
| I. Admin | Admin API: reports, hide/remove, restrict accounts, featured | Not started | |
| I. Admin | Audit log | Not started | |
| I. Admin | Web admin console | Deferred | Open decision 12 |
| J. Commercial | One paid flow with verified webhooks | Blocked | Open decisions 8 and 9 |
| Notifications | In-app notifications | Not started | |
| Notifications | Email and push through outbox | Blocked | Open decision 10 for email |
| Operations | Rate limiting | Not started | |
| Operations | Error reporting and analytics | Not started | |
| Operations | Backup and restore drill | Not started | |

## Out of scope for the MVP

Live location, GPS recording, navigation, fitness analytics, leaderboards, activity sync, direct messaging, peer-to-peer marketplace, multi-vendor payouts, AI features, offline navigation, multi-country tax automation.
