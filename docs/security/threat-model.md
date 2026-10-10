# Threat model

Status: baseline written before implementation. Every mitigation below is a requirement, not a description of something built. Review this when adding an endpoint, a data field, a provider or a role, and before each release gate.

## What we are protecting

- Member accounts and identity
- Personal data, above all anything that reveals where a person is or lives
- Exact meeting points of private rides
- Integrity of RSVPs, capacity, bookings and payment state
- Moderation and admin powers
- Media bucket contents
- Secrets and provider credentials

## Trust boundaries

1. Mobile app ↔ API. The app is untrusted: it can be modified, and anything in its bundle is public.
2. API ↔ Neon, R2 and Cloudflare bindings. Trusted, credentials held as Worker secrets.
3. API ↔ external providers. Inbound webhooks are untrusted until their signature is verified.
4. Member ↔ member. Content written by one member is untrusted when shown to another.
5. Staff ↔ platform. Admins are trusted but accountable; their actions are logged.

## Threats and mitigations

### Account takeover

| Threat | Mitigation |
| --- | --- |
| Credential stuffing, weak passwords | Strict rate limits and lockout on sign-in, sign-up and reset endpoints; minimum password policy; hashing only through Better Auth |
| Password hash or session table leak | Auth tables restricted, excluded from logs and exports; encrypted backups; ability to revoke all sessions |
| Stolen session reused | Session expiry and rotation through Better Auth; server-side revocation; session material in SecureStore, never AsyncStorage |
| Forged session or token | Sessions validated server-side on every request; signing secret held as a Worker secret and rotatable |
| Account hijack through email change or recovery | Verified, single-use, short-lived links through Better Auth; notify the old address; responses do not reveal whether an email is registered |
| Deep link opened without a session | Route to sign-in and resume; never render protected data from cache for a signed-out user |
| Stolen session used to delete the account | Accepted for now: deletion needs a confirmation value but not re-authentication. Add a fresh sign-in requirement before launch |

### Privilege escalation

| Threat | Mitigation |
| --- | --- |
| Member edits another member's or club's resource by changing an ID | Resource-level check in the service for every write and every non-public read |
| Role taken from a client-supplied field or token claim | Roles stored in RideSphere's database only; request bodies cannot set role or status fields; schemas reject unknown keys |
| Organiser acts outside their club | Permission checks scoped to club membership and role |
| Self-promotion to moderator or admin | Role grants are admin-only, logged, and cannot target the acting user |
| Suspended user keeps acting with a valid token | Account status checked by the API on each request |

### RSVP abuse

| Threat | Mitigation |
| --- | --- |
| Overbooking under concurrent joins | Row lock or atomic conditional update inside a transaction; concurrency test in CI |
| Duplicate RSVPs | Partial unique index on active RSVP per user and ride |
| Seat hoarding, join/cancel churn, bot sign-ups | Rate limits per user and per ride; organiser can remove participants |
| Harvesting participant lists | Participant visibility rules; lists never public for private rides |

### Fake payment callbacks (applies once payments are approved)

| Threat | Mitigation |
| --- | --- |
| Forged webhook marks a booking paid | Verify the provider signature over the raw body; reject on failure |
| Replayed webhook | Unique constraint on provider event ID; idempotent handler; timestamp tolerance |
| Client claims success after redirect | Booking state changes only from verified webhooks or a server-to-server lookup |
| Tampered amount or currency | Price computed server-side from the trip or event record |
| Double charge from retries | Idempotency keys on booking and checkout creation |

### Malicious uploads

| Threat | Mitigation |
| --- | --- |
| Executable or oversized file disguised as an image | Presigned URL bound to a server key; post-upload check of real size and content signature against an allowlist per purpose |
| XML attacks in GPX (entity expansion, external entities) | Parser with entities disabled, size cap, element and point count cap |
| Stored script served back to users | No public bucket; downloads forced as attachments with a fixed safe content type; never render uploaded content as HTML |
| Path traversal or key guessing | Server-generated random keys; client filename never used |
| Storage exhaustion | Per-user quotas and rate limits on upload intents; cleanup of unconfirmed uploads |
| Location metadata in photos | Strip EXIF on device before upload; verify during mobile QA |

### Spam and abuse

| Threat | Mitigation |
| --- | --- |
| Post and comment flooding | Rate limits, length limits, new-account throttles |
| Harassment | Block (mutual invisibility where practical), report, moderator queue, account restriction |
| Malicious reports to silence someone | Rate-limited reports; reports trigger review, not automatic removal |
| Fake clubs or rides | Organiser approval; club moderation status |
| Stored XSS in a future web client | Treat all user text as plain text; escape on render; no HTML input |

### Location disclosure

| Threat | Mitigation |
| --- | --- |
| Finding where a member lives | Only a broad, user-chosen area is stored; no address fields; no live or background location |
| Stalking through ride attendance | Participant list visibility rules; block hides the blocker's attendance from the blocked user where feasible |
| Private meeting point leaked | Exact instructions returned only to authorised viewers; excluded from list endpoints, search and push payloads |
| GPX reveals a start at someone's home | Organiser guidance at upload; GPX access follows ride visibility |

### Admin misuse

| Threat | Mitigation |
| --- | --- |
| Admin browses private data without reason | Least-privilege roles; moderator separate from platform admin |
| Unaccountable moderation | Append-only audit log of consequential actions with actor, target, reason and time |
| Compromised admin account | Strong authentication on admin accounts; Cloudflare Access in front of the future console |
| Direct database edits | Production database access restricted to the technical founder; changes go through migrations |

### Platform and supply chain

| Threat | Mitigation |
| --- | --- |
| Secret committed or bundled | `.gitignore`, secret scanning in CI, only `EXPO_PUBLIC_*` publishable values in the app |
| Vulnerable dependency | Lockfile, automated dependency alerts, review before adding packages |
| Sensitive data in logs | Structured logging with an explicit field allowlist; no tokens, bodies or payment payloads |
| Overly broad CORS when the website arrives | Explicit origin allowlist per environment |
| Leaked Cloudflare or Neon credentials | Scoped API tokens, separate credentials per environment, documented rotation |

## Accepted risks for the MVP

- Rate limiting through the Workers binding is approximate, not exact. Acceptable for abuse control; not used as a business rule.
- Moderation is human and reactive. There is no automated content scanning.
- No formal penetration test before the closed beta; an external review of auth, authorisation, payments and uploads is budgeted before public launch.

## Not covered here

Legal compliance. This document describes technical controls and does not establish compliance with Thailand's PDPA or any other law.
