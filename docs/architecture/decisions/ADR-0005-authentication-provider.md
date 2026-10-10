# ADR-0005: Authentication with self-hosted Better Auth

- Status: Accepted (owner decision, 2026-10-10). Integration details to be settled in increment 4
- Date: 2026-10-10

## Context

The proposal requires a managed identity provider so that RideSphere never stores passwords. The provider must work with Expo and issue JWTs that the API can verify against a JWKS endpoint. The API runs on Cloudflare Workers, so verification has to work with Web Crypto.

## Principles set before the provider was chosen

These were written for a managed provider and are adjusted by the decision below:

- The API verifies signature, issuer, audience and expiry with `jose` against the provider's JWKS, with keys cached.
- The provider's subject maps to an internal `users` row through a unique `auth_subject`. Roles and account status live in RideSphere's database, not in provider claims.
- Provider-specific code sits behind a small adapter on both the client and the server.
- Suspended and deleted accounts are rejected by the API regardless of token validity.

## Selection criteria

| Criterion | Why it matters |
| --- | --- |
| Maintained Expo SDK, works in development builds | Core to the mobile app |
| JWKS endpoint and standard JWTs | Required by the API design |
| Email plus Apple and Google sign-in | Apple requires Sign in with Apple when other social logins are offered |
| Account deletion API | Store rules and privacy law require in-app deletion |
| Pricing at 1k, 10k and 50k monthly users | Cost grows with success |
| Data region and processor terms | Thailand PDPA and other target markets |
| User export | Avoiding lock-in |

## Candidates to compare

Clerk, Supabase Auth, Auth0, Firebase Authentication, and self-hosted Better Auth on the existing Worker and Neon database. The last one is not a managed provider and would mean RideSphere holds password hashes, which the proposal advises against; it is listed only so the trade-off is considered deliberately.

Pricing and regional terms must be checked against each vendor's current published information at the time of the decision. Nothing here should be read as a quotation.

## Decision

The owner chose **Better Auth, self-hosted** on the API Worker with its tables in the Neon database. No per-user fee, no additional vendor, and identity data stays in RideSphere's own database.

This departs from the proposal's "managed identity provider; no custom password storage" baseline, knowingly.

## Consequences

- RideSphere stores password hashes, sessions and verification tokens. They are produced and checked only by Better Auth; no hand-written password, hashing or token code is allowed.
- The API is itself the identity provider. Requests are authenticated by Better Auth session validation rather than by verifying a third party's JWT. The `jose`/JWKS principle above applies only if a JWT plugin is later enabled for other clients.
- The mobile app uses Better Auth's Expo integration, with session material in SecureStore.
- Things a managed provider would have supplied are now ours to build and operate: email delivery for verification and password reset (needs the email provider, open decision 10), rate limiting and lockout on sign-in endpoints, breached or weak password policy, Apple and Google sign-in configuration, session revocation, and account deletion.
- Auth endpoints become the most sensitive part of the API. They get the strictest rate limits, and they are in scope for the external security review before launch.
- Password hashing costs CPU time on Workers. Confirm the hashing configuration fits the plan's CPU limit during increment 4.
- The auth tables hold the most sensitive data in the database: restrict access, keep them out of logs and exports, and cover them in the data inventory.
- Roles and account status still live in RideSphere's own tables, and suspended or deleted accounts are rejected by the API.

## Amendments

**2026-10-10 — increment 4 findings.**

- Better Auth 1.7 runs on the Worker, created per request with the Drizzle adapter over Hyperdrive. Sign-up, sign-in, sign-out and session checks were exercised on staging.
- Password hashing uses Better Auth's own Workers build, which calls the runtime's native scrypt. No custom hashing code exists. A handful of sign-ups and sign-ins on staging succeeded in 0.6 to 1.2 seconds each; this was not a load test, and the free plan's CPU limit remains a risk (open decision 19).
- Auth endpoints live under `/api/v1/auth` and return Better Auth's own error shape (`{ code, message }`), not the RideSphere error envelope. The app maps known codes to its own messages and never displays server messages it does not recognise.
- Requests carrying a session must present a trusted origin: the app's `ridesphere://` scheme, plus `exp://` (Expo Go) outside production.
- Rate limits are stored in Postgres because isolates share no memory.
- Launch sign-in methods: email and password, Google and Apple. The server enables Google or Apple only when its credentials are configured; none are yet.
- Neon Auth (Neon's managed Better Auth) was looked at after this decision. It was not adopted: it does not offer Apple sign-in and does not document an Expo client, both of which this app needs.

## Still to settle

1. Password hashing under load against the Workers CPU limit of the plan in use.
2. Email verification and password reset, which depend on the email provider.
3. Google and Apple sign-in in the app, once credentials exist.
4. Account deletion, lockout after repeated failures and a breached-password check.
