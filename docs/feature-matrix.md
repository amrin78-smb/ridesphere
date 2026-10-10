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
| Env binding validation | Implemented | Validated once per isolate; covers environment, database and auth settings |
| Drizzle schema and first migration | Partial | `clubs`, Better Auth tables and `profiles`, applied to Neon `dev` and `staging` |
| Hyperdrive connectivity | Partial | Staging Worker reaches Neon `staging` through Hyperdrive (readiness 200, about 0.3 s). The row-lock transaction spike in ADR-0003 is still to do |
| OpenAPI document | Partial | Generated at `/api/v1/openapi.json` for health and `/me`. Better Auth's own endpoints under `/api/v1/auth` are not in it |
| Mobile app shell, tabs, design tokens | Partial | Five tabs, tokens, loading/empty/error component, API client, sign-in and profile screens. Bundles for iOS and Android and renders on web; not yet run on a physical device or simulator. Icons and splash are Expo placeholders |
| Synthetic seed data | Not started | |
| Staging deployment | Partial | Deployed by hand with `pnpm --filter @ridesphere/api deploy:staging`; not yet automated from CI |
| Production deployment | Not started | No production Hyperdrive configuration or Worker |

## MVP features

| Area | Feature | Status | Notes |
| --- | --- | --- | --- |
| A. Auth | Register, login, logout with email and password | Partial | API verified on staging with curl. App screens are built and unit-tested but have not been run on a device yet |
| A. Auth | Session restore, expired-session handling, unauthenticated deep links | Partial | Session is kept in secure storage by the Better Auth Expo client; behaviour on a device is untested |
| A. Auth | Google sign-in | Blocked | Server enables it when the Google credentials are set; no credentials yet and no button in the app |
| A. Auth | Apple sign-in | Deferred | Dropped for now by the owner. See open decision 20 before an iOS release |
| A. Auth | Sign-in rate limiting | Partial | Better Auth database-backed limits (5 sign-ins per minute, 5 sign-ups per hour per IP). No lockout or breached-password check yet |
| A. Auth | Email verification and password recovery | Blocked | Open decision 10 (email provider) |
| A. Auth | Account deletion | Blocked | Open decision 13 |
| B. Profile | Basic profile: display name, home area, locale | Partial | `GET`/`PATCH /api/v1/me` and an edit screen. Avatar, languages, bike types, riding styles, pace and experience not started |
| B. Profile | Profile visibility controls | Partial | Stored and editable through the API; nothing reads it yet because no other member's profile can be viewed |
| B. Profile | Roles and account status | Partial | Stored server-side, not settable by the member, suspended and deleted accounts are refused. No admin operations to change them yet |
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
