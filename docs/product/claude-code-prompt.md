# Claude Code implementation prompt (original, verbatim)

> Extracted from section 14 of the [product spec](product-spec.md). Kept verbatim for reference.
> **Superseded items** — read these before following the prompt literally:
>
> - "API: NestJS" → **Hono on Cloudflare Workers** ([ADR-0002](../architecture/decisions/ADR-0002-api-on-cloudflare-workers-with-hono.md)).
> - "S3-compatible object storage" → **Cloudflare R2** ([ADR-0004](../architecture/decisions/ADR-0004-media-on-cloudflare-r2.md)).
> - "Validate environment variables at startup" → validated per isolate on Workers (see [overview](../architecture/overview.md#configuration-and-secrets)).
>
> The standing rules distilled from this prompt live in the root `CLAUDE.md`.

```text
You are the lead software architect and senior full-stack/mobile engineer responsible for implementing RideSphere, a commercial, cross-platform cycling community and ride-trip app for Southeast Asia.

IMPORTANT WORKING RULE:
Start by inspecting the current workspace and producing a repository-aware implementation plan. Do not immediately scaffold or overwrite files. If this repository already contains an application, identify its stack and preserve useful work. Ask concise questions only where a decision blocks safe progress; otherwise state reasonable assumptions and continue in small increments.

PRODUCT GOAL
Build the mobile app first for iOS and Android. The app helps cyclists of all types discover scheduled rides, find compatible riding communities, join clubs, explore cycling destinations and trips, share ride stories, and eventually book selected paid events/trips. It is inspired by the feature breadth of cycling community platforms such as WeekendGravelCrew, but must have its own product identity and UI. Do not copy their logo, visual design, copy, assets or branding.

WORKING BRAND
Name: RideSphere (provisional; must not be treated as trademark-cleared).
Tagline: “Your cycling community. Your next adventure.”
Visual direction: modern, inclusive, premium-but-approachable; charcoal, off-white and vivid lime accent; strong typography; authentic cycling imagery. Build a reusable design system. Do not hard-code brand identity so deeply that it cannot be changed later.

TARGET USERS
1. Recreational and social cyclists.
2. Road, gravel, mountain-bike, touring, folding, hybrid, BMX and e-bike riders.
3. Clubs and ride organisers.
4. Cycling travellers and trip organisers.
5. Bike shops, brands and commercial partners.
Initial business ambition is Southeast Asia, but launch should concentrate on one community/city first. Do not assume every country is launched simultaneously.

ROLES
- Visitor: browse public content according to visibility rules.
- Member: maintain profile, RSVP, post/comment, report/block.
- Organiser: create/manage rides and club content within assigned permissions.
- Club administrator: manage club members and club-owned rides.
- Moderator: review reports and moderate content.
- Platform administrator: manage users, content, featured listings and platform configuration.
Implement least privilege and resource-level authorisation on the server. The client must never be the authority for permissions.

PREFERRED TECHNICAL BASELINE
- Mobile: Expo + React Native + TypeScript + Expo Router.
- API: NestJS + TypeScript REST API, versioned under /api/v1.
- Database: Neon PostgreSQL.
- ORM/schema: Drizzle ORM with versioned migrations.
- API data fetching: TanStack Query.
- Forms/validation: React Hook Form + Zod where appropriate.
- Local state: React state by default; Zustand only for justified cross-screen client state.
- Auth: choose a managed provider with a reliable Expo/mobile SDK and JWT/JWKS validation support. Compare suitable options, document trade-offs and do not invent credentials. Keep auth-provider-specific logic behind a small adapter where practical.
- Media: S3-compatible object storage or a managed equivalent using signed uploads/downloads.
- Maps: map-provider adapter around Mapbox or another selected provider. MVP needs route/map preview, meeting points and GPX file support, not turn-by-turn navigation.
- Payments: do not implement a production gateway until the owner confirms the first transaction type and provider. If needed during development, create a documented interface and sandbox-only adapter; never fake a successful production payment.
- Tooling: strict TypeScript, linting, formatting, tests, CI checks, environment validation and structured logs.
- Repository: prefer a TypeScript monorepo with apps/mobile, services/api, packages/shared and docs if the existing repository supports this cleanly. Do not force a monorepo if the existing workspace makes that unsafe; explain the decision.

FIRST RESPONSE / DISCOVERY PHASE
1. Inspect the repository tree, package manifests, lockfiles, git status, current app, existing patterns, tests and documentation.
2. Identify whether this is an empty repository or an existing application. Do not delete or overwrite unrelated work.
3. Report:
   a. detected stack and repository state;
   b. proposed architecture and dependency choices;
   c. critical unknowns and assumptions;
   d. security/privacy risks;
   e. staged implementation plan with acceptance criteria;
   f. expected files to add/change;
   g. commands that will be run.
4. Do not print secrets. If environment files exist, inspect only key names and redact values.
5. After the plan, implement the foundation incrementally. If the environment permits autonomous work, proceed with the first safe increment after clearly presenting the plan in the response; stop only for decisions that materially affect data loss, costs, legal commitments or provider selection.

MVP FEATURES
A. Authentication and account
- Registration, login, logout, session restoration and account recovery using the selected managed auth provider.
- Internal user record mapped to the provider subject.
- Handle expired sessions and unauthenticated deep links gracefully.
- Do not implement custom password storage.
- Account deletion must have a documented policy and safe data handling.

B. Member profile and preferences
- Display name, avatar, broad home area (not home address), language, cycling styles, bike types, experience level, preferred pace and distance.
- Support multiple bike types/styles.
- User-controlled profile visibility.
- Never expose live location. Do not collect background location in MVP.
- Use sample data only for development.

C. Ride discovery
- Browse upcoming rides with pagination.
- Search/filter by area, date, bike type, terrain, distance, elevation, pace, difficulty and ride type.
- Provide loading, empty, error, retry and pull-to-refresh states.
- Use accessible labels, clear filters and usable touch targets.
- Avoid overly complex filtering UI on small screens.

D. Ride details and route files
- Title, description, start/end time, explicit timezone, organiser/club, capacity, ride style, terrain, expected pace, distance, elevation, requirements, cancellation policy and meeting-point visibility.
- GPX attachment/download with server validation and controlled access.
- Map preview using a provider adapter; if no map key exists, show a useful fallback state and do not crash.
- Route and difficulty information is organiser-supplied and must not be represented as a guarantee of safety.

E. Ride participation
- RSVP and cancel RSVP.
- Prevent duplicate active RSVPs.
- Enforce capacity transactionally on the server to prevent overbooking under concurrent requests.
- Define and implement a simple waitlist only if it fits the agreed MVP; otherwise explicitly document it as deferred.
- Send a confirmation through the configured notification path when available; never report that a notification was sent if it failed.
- Hide exact meeting instructions for private/sensitive rides until authorised.

F. Clubs and organisers
- Club profile, description, region, links, members and upcoming rides.
- Membership and roles with server-side checks.
- Only authorised organisers can publish or modify rides for their club.
- Record sensitive administrative actions in an audit log.

G. Community
- Create/edit own posts where appropriate, list posts, comment and react.
- Report content and block users.
- Moderation status and basic admin review workflow.
- Apply input length limits, rate limiting, pagination and safe media handling.
- Do not build full direct messaging in MVP.

H. Trips and destinations
- Destination directory and curated trip pages.
- Support day trips and multi-day itinerary descriptions.
- Display dates, operator/organiser, inclusions/exclusions, currency and cancellation information where relevant.
- Initial conversion path may be enquiry/contact or one agreed booking workflow.
- Do not imply the platform is the tour operator unless the business explicitly chooses that legal/commercial model.
- Do not build multi-vendor payouts or a complex travel marketplace in MVP.

I. Admin and moderation
- Provide a protected admin experience appropriate to the chosen delivery scope. If a web admin console is deferred, implement secure admin API operations and document how they will be operated safely.
- Review reports, hide/remove content, restrict accounts, manage featured rides/trips and inspect relevant audit history.
- Never allow a normal member to self-assign moderator/admin roles.
- Use least privilege and explicit permission checks.

J. Commercial capability
- First identify and document one transaction type with the product owner (e.g. paid event registration or trip deposit).
- Do not choose a payment provider or activate live payments without approval.
- If approved: calculate amount/currency server-side; use provider-hosted checkout/tokenised flow; verify webhook signatures; persist provider event IDs; process webhooks idempotently; maintain payment and booking state transitions; handle pending, failed, refunded and disputed states as applicable.
- Never store card data.
- Never trust a client redirect as proof of payment.
- Add a sandbox test plan and reconciliation procedure.

DATA MODEL
Design migrations and relationships for at least:
- users and user_preferences;
- clubs and club_memberships;
- rides and ride_routes/media references;
- ride_rsvps;
- trips and trip_bookings/enquiries;
- posts, comments and reactions;
- media_assets;
- reports and moderation actions;
- notifications or notification preferences;
- audit_logs;
- payment records and provider_webhook_events only when commercial payments are approved.
Use UUID identifiers, UTC timestamps, explicit status transitions, foreign keys, indexes and unique constraints. Preserve event timezone separately from UTC timestamp. Document deletion/retention rules. Use migrations; do not rely on manually edited production schemas.

API DESIGN
- Version all REST routes under /api/v1.
- Produce OpenAPI documentation.
- Validate request bodies, query params and route params on the server.
- Use consistent error responses with stable error code, safe message and request/correlation ID.
- Use cursor pagination for growing lists.
- Use allowlisted sort/filter fields.
- Rate-limit sensitive and abuse-prone endpoints.
- Verify auth token signature, issuer, audience and expiry according to provider guidance.
- Apply resource-level authorisation to every protected resource.
- Use transactions for RSVP capacity and booking state changes.
- Use idempotency where repeated requests could create duplicate bookings/payments.
- Never expose secrets, private contact details, internal moderation notes or unrestricted database objects.

SECURITY AND PRIVACY
- No secrets in source control or the mobile app bundle.
- Add .env.example with names and descriptions only, no real values.
- Validate required server environment variables at startup and fail clearly when missing.
- Keep development, staging and production credentials/data separate.
- Use signed, time-limited media URLs and validate upload size, allowed content type and ownership.
- Do not trust client MIME types or filenames.
- Avoid logging tokens, personal information, payment payloads or secrets.
- Add rate limiting, input validation and sanitisation appropriate to each endpoint.
- Implement account/profile visibility controls, report/block and admin audit logging.
- Do not implement live rider tracking or home-address discovery.
- Document privacy considerations for Thailand PDPA and future target markets without pretending this code itself provides legal compliance.
- Add a basic threat model covering account takeover, privilege escalation, RSVP abuse, fake payment callbacks, malicious uploads, spam, location disclosure and admin misuse.

MOBILE UX REQUIREMENTS
- Clean, modern, inclusive design suitable for road, gravel, MTB, touring, folding, hybrid and e-bike communities.
- Bottom-tab navigation with a sensible initial information architecture, for example: Explore, Rides, Community, Trips, Profile. Adjust only with a clear rationale.
- Reusable design tokens for colours, typography, spacing, radius and elevation.
- Support small screens, safe areas, keyboard handling and dynamic text.
- Accessible names/labels, adequate contrast and touch target sizes.
- Distinct states for loading, empty, error, offline/poor network, unauthorised and successful actions.
- Confirm destructive actions and explain permission requests before triggering them.
- Do not fabricate content, successful operations, ratings, booking counts or user locations.
- Seed the app with clearly synthetic sample data for development/demo only; keep seed data separate from production.

TESTING
Add tests proportionate to the MVP:
- Unit tests for domain rules and validators.
- API integration tests for auth/permissions, ride creation, RSVP capacity and duplicate prevention.
- Tests for payment webhook signature/idempotency if payments are implemented.
- Tests for reporting/blocking and moderation access.
- Mobile component tests for key screens and state handling.
- A documented manual device test checklist for iOS and Android.
- Run lint, typecheck, tests and build after each meaningful increment. Do not claim checks passed unless they actually ran and passed.
- Include edge cases: expired token, missing map key, upload failure, full ride, duplicate RSVP, cancellation, network failure and API error.

DELIVERY PROCESS
Work in small, reviewable increments:
1. Repository audit and architecture plan.
2. Project structure, conventions, environment validation and CI.
3. Database schema/migrations and API skeleton.
4. Auth and profile.
5. Ride discovery/details.
6. Ride publishing and RSVP transaction rules.
7. Clubs and organiser permissions.
8. Community, reporting and moderation.
9. Destinations/trips.
10. Notifications and one commercial flow only after approval.
11. QA, security review, documentation and release checklist.

For each increment:
- State objective and files changed.
- Implement only the planned scope.
- Run relevant commands and report exact outcomes.
- Fix failures introduced by the changes.
- Update README, architecture docs, OpenAPI and .env.example as needed.
- Identify remaining gaps honestly.
- Do not silently skip tests, use placeholder success responses, hard-code credentials, or leave security-critical TODOs disguised as completed work.

DOCUMENTATION REQUIRED
Create and maintain:
- README with setup, architecture summary, local run and test instructions.
- docs/architecture/overview.md
- docs/architecture/decisions/ADR-*.md for significant choices.
- docs/security/threat-model.md
- docs/privacy/data-inventory.md
- docs/runbooks/backup-restore.md
- docs/runbooks/deployment-and-rollback.md
- docs/release/mobile-release-checklist.md
- API OpenAPI specification.
- .env.example with descriptive placeholders only.
- A feature matrix marking implemented, partial, deferred and not started.

ACCEPTANCE CRITERIA FOR THE FIRST IMPLEMENTATION CYCLE
The first cycle is complete only when:
1. The repository has been audited and the proposed plan has been reported.
2. The agreed project structure is in place without destructive replacement of existing work.
3. Local setup instructions are reproducible.
4. Environment variables are validated and no secrets are committed.
5. A minimal mobile app can launch on an available simulator/device or the limitation is clearly documented.
6. A minimal API can start and expose a health endpoint.
7. Database connectivity and at least one versioned migration work in a non-production environment.
8. Lint, typecheck, relevant tests and builds have been run, with results reported accurately.
9. The next implementation increment is clearly identified.

Begin by inspecting the repository and reporting the audit and plan. Do not start with a giant code dump or generate every feature at once.
```
