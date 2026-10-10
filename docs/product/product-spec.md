# RideSphere — Mobile App Architecture & Build Proposal

> Markdown conversion of the original proposal (`source/RideSphere_Mobile_App_Architecture_and_Claude_Code_Prompt.docx`, prepared 10 October 2026). Content is unchanged apart from formatting.
> Where this proposal and later decisions differ (notably the API framework and hosting), the ADRs in `docs/architecture/decisions/` take precedence.

| DOCUMENT | WORKING DECISIONS |
| --- | --- |
| Product | All-types cycling community and ride-trip platform |
| Launch strategy | Mobile app first; website follows using the same backend APIs |
| Initial region | Southeast Asia, starting with one concentrated launch community |
| Business objective | Commercial platform with event, trip and partner revenue |
| Working brand | RideSphere — subject to domain, trademark and app-store checks |
| Prepared | 10 October 2026 |

Purpose

This document is the proposed source of truth for product planning and the first Claude Code implementation cycle. It intentionally separates launch-critical capabilities from later features so the first release can be built, tested and operated by a small team.

## 1. Executive recommendation

Build a cross-platform mobile app for iOS and Android first, supported by a backend API designed from day one to serve a future public website and admin console. The product helps cyclists discover rides, find compatible riding buddies, join clubs, explore cycling trips and participate in a trusted community.

The product should not attempt to replace Strava, Komoot or dedicated navigation computers. Its differentiation is social discovery and the organisation of real-world rides and trips.

### Recommended baseline

| Area | Recommendation | Reason |
| --- | --- | --- |
| Mobile client | Expo + React Native + TypeScript + Expo Router | One app codebase for iOS and Android; suitable TypeScript ecosystem. |
| Client data | TanStack Query; small Zustand store only where needed | Server state and local UI state stay distinct; avoid excessive global state. |
| Backend | NestJS REST API in TypeScript | Mobile-first API that can later serve a website and admin console independently. |
| Database | Neon PostgreSQL + Drizzle ORM + migrations | Relational model fits rides, RSVPs, clubs, trips and bookings; familiar managed PostgreSQL. |
| Authentication | Managed auth provider with mobile SDK and JWT/JWKS validation | Avoid custom password handling. Select provider after validating price, regional availability and integration. |
| Media | S3-compatible object storage; signed uploads/downloads | Keep images and GPX files out of database rows; control access. |
| Maps | Mapbox or equivalent; abstract provider-specific code | Route previews and meeting points without committing to full navigation. |
| Payments | One gateway and one initial transaction type | Reduce refunds, payout, tax and marketplace complexity. |
| Deployment | Separate dev/staging/production; managed hosting and CI | Safer releases and predictable recovery. |

### Decision principle

Prefer a modular monolith and a small number of managed services. Do not introduce microservices, event streaming, live GPS tracking, a recommendation engine or multi-seller payment settlement in the MVP.

## 2. Product vision and positioning

### Vision

Make it easier for people across Southeast Asia to find where to ride, who to ride with and which cycling trips are worth taking.

### Primary audiences

| Audience | Need | MVP response |
| --- | --- | --- |
| Social and recreational cyclists | Find welcoming rides at a suitable pace | Ride search, filters, ride details, RSVP and organiser information. |
| Enthusiasts | Discover routes, events and compatible riders | Bike/riding preferences, GPX download and community posts. |
| Clubs and ride organisers | Publish events and manage attendance | Club profile, organiser role, ride publishing, capacity and participant list. |
| Cycling travellers | Discover destinations and organised trips | Destination pages, itinerary overview and enquiry/booking path. |
| Commercial partners | Reach cyclists and sell relevant services | Partner profiles, sponsored placements and tracked enquiries. |

### Brand guidance

Working brand: RideSphere. Suggested tagline: “Your cycling community. Your next adventure.” Use a distinct identity rather than reproducing WeekendGravelCrew’s visual style. Suggested direction: charcoal, off-white and vivid lime accent; confident typography; authentic Southeast Asian cycling photography; inclusive language.

Name is provisional. Before public use, check domain names, social handles, app-store names and relevant trademarks in intended markets.

## 3. MVP scope

### Required for first public release

- Authentication: registration, login, logout, password/account recovery and social login only if supported reliably by the chosen provider.
- Member profile: display name, avatar, broad home area, languages, riding styles, bike types, preferred pace and self-described experience.
- Ride discovery: upcoming rides, keyword search and filters for area, date, bike type, distance, elevation, terrain, pace and difficulty.
- Ride details: description, start time, approximate/public meeting point as configured by organiser, route summary, GPX download, capacity, requirements, cancellation policy and organiser.
- Ride participation: RSVP, cancel RSVP, capacity enforcement, waitlist if included, participant list visibility rules and confirmation notifications.
- Club and organiser pages: club description, social links, approved organisers and list of upcoming rides.
- Trip discovery: curated destination pages, day-trip or multi-day itinerary details, organiser/contact details and enquiry or one basic booking flow.
- Community: posts, comments, reactions, photo uploads, report/block and admin moderation.
- Admin: manage members, rides, clubs, trips, reports, featured content and basic commercial listings.
- Commercial capability: implement one validated paid workflow, preferably event registration or a trip deposit; support payment status, webhook verification, refunds/manual exception handling and receipts as appropriate.
- Operational foundations: analytics, error reporting, audit events for sensitive actions, backups, rate limits and documented support process.

### Explicitly out of scope for MVP

- Live location sharing, background GPS recording or turn-by-turn navigation.
- Full fitness analytics, training plans, leaderboards and automatic activity syncing.
- A complex peer-to-peer marketplace with shipping, seller payouts and dispute workflows.
- Multi-operator marketplace settlement or holding customer funds on behalf of third parties.
- AI recommendations, chatbots and generative AI features.
- Offline-first route navigation, advanced route planning and automated route safety assessment.
- Multi-country tax automation or simultaneous full commercial launch in every Southeast Asian market.

### MVP acceptance outcomes

- A new member can register, complete a profile and discover a suitable ride.
- An authorised organiser can publish a ride with capacity, route details and GPX attachment.
- A member can RSVP and cancel; the server prevents overbooking under concurrent requests.
- Members can join community discussions and report inappropriate content.
- An admin can moderate content and suspend accounts with a recorded audit trail.
- A user can complete the selected paid flow in a test environment; payment state is verified server-side via signed webhook, not trusted from the client.
- The app handles loading, empty, error, offline and expired-session states without crashing.
- A staging build can be installed on both iOS and Android test devices.

## 4. Application architecture

### Logical architecture

| Layer | Responsibilities | Constraints |
| --- | --- | --- |
| React Native app | Navigation, screens, forms, local preferences, push token registration, API client. | No secrets, payment verification or authoritative permissions in client code. |
| API layer | REST endpoints, validation, auth guards, rate limits, request IDs, error mapping. | Version the API; return consistent error structures. |
| Domain modules | Users, clubs, rides, RSVPs, trips, community, media, payments, notifications, admin. | Modules own their domain rules; avoid cross-module database logic scattered through controllers. |
| PostgreSQL | Transactional source of truth for entities and state transitions. | Constraints and transactions enforce integrity; migrations are versioned. |
| Object storage | Profile images, ride photos and GPX files. | Private by default where appropriate; signed, time-limited access. |
| External providers | Auth, maps, payments, email, push, monitoring. | Wrap behind adapters where provider lock-in would be costly; document outages and fallbacks. |

### Mobile app structure

```
apps/
  mobile/
    app/                    # Expo Router routes and layouts
    src/
      components/           # Reusable, accessible UI
      features/
        auth/
        profile/
        rides/
        clubs/
        trips/
        community/
        notifications/
        bookings/
      lib/                  # API client, query client, analytics
      hooks/
      theme/
      types/
      utils/
    assets/
    tests/
services/
  api/                      # NestJS REST API
    src/
      modules/
        auth/
        users/
        clubs/
        rides/
        rsvps/
        trips/
        community/
        media/
        payments/
        notifications/
        admin/
      common/               # Guards, filters, DTO validation, logging
      config/
    test/
packages/
  shared/                   # Shared schemas/types only where safe
  config/                   # Lint/TypeScript config
docs/
  architecture/
  api/
  runbooks/
```

This is a suggested monorepo structure, not a requirement to create every folder at once. Keep the mobile app and API deployable independently. Shared code must not accidentally pull server-only dependencies into the mobile bundle.

### Recommended mobile libraries

| Concern | Candidate | Guidance |
| --- | --- | --- |
| Navigation | Expo Router | Use file-based routes and typed route patterns. |
| API cache | TanStack Query | Server data, retries, invalidation and pagination. |
| Forms | React Hook Form + Zod | Typed validation and predictable form errors. |
| Local state | React state; Zustand only if justified | Do not mirror all server data in a global store. |
| Secure tokens | Provider SDK / Expo SecureStore as appropriate | Never put long-lived credentials in plain AsyncStorage. |
| Maps | Mapbox SDK or supported map library | Start with map/route preview, not navigation. |
| Media | Image picker + direct signed uploads | Resize/compress on device when appropriate; validate server-side. |
| Testing | Jest or Vitest where compatible, React Native Testing Library, Maestro optional | Test critical user journeys and API contracts. |

### Backend module boundaries

- Identity and Users: map external identity subject to internal user record; profile preferences and account status.
- Clubs: club records, membership, roles and organiser privileges.
- Rides: event details, visibility, lifecycle, route metadata and cancellation.
- RSVPs: capacity and waitlist rules, duplicate prevention and transaction-safe joins.
- Trips: destinations, itineraries, departures, enquiries and bookings.
- Community: posts, comments, reactions, reporting, blocking and moderation.
- Media: upload intents, file validation, ownership, metadata and signed URLs.
- Payments: checkout session creation, verified webhooks, payment ledger references, refunds and reconciliation status.
- Notifications: in-app notifications and email/push dispatch; use an outbox or durable job mechanism if delivery reliability requires it.
- Admin and audit: moderation actions, account restrictions, featured content and audit trail.

## 5. Data model and integrity

Use PostgreSQL as the authoritative source of truth. Apply UUID primary keys, UTC timestamps, explicit status enums or constrained values, created_at/updated_at fields and migrations. Use soft deletion only where a business or legal requirement justifies it; define retention and deletion rules.

| Entity | Key fields / relationships | Important rules |
| --- | --- | --- |
| users | id, auth_subject, display_name, avatar_key, home_area, locale, status | Unique external auth subject; account deletion and suspension states. |
| user_preferences | user_id, bike_types[], riding_styles[], pace, distance range | Use explicit allowed values; allow multiple styles. |
| clubs | id, slug, name, description, region, status | Unique slug; controlled ownership and moderation. |
| club_memberships | club_id, user_id, role, status, joined_at | Unique club/user pair; server-side role checks. |
| rides | id, club_id, organiser_id, title, starts_at, timezone, capacity, status, visibility | Validate future dates, lifecycle transitions and ownership. |
| ride_routes | ride_id, distance_m, elevation_m, terrain, start coordinates, gpx_object_key | GPX file access follows ride visibility; validate file size and content. |
| ride_rsvps | ride_id, user_id, status, created_at | Unique active RSVP per user/ride; enforce capacity transactionally. |
| trips | id, organiser_id, destination, start/end dates, price display, booking mode, status | Clearly state inclusions, exclusions, cancellation terms and provider role. |
| trip_bookings | id, trip_id, user_id, quantity, amount, currency, status, provider reference | Idempotent creation; server-owned amount and state transitions. |
| posts/comments | author_id, body, media references, status, created_at | Moderation state, rate limits, report/block handling. |
| media_assets | owner_id, object_key, mime_type, size_bytes, purpose, moderation_status | Do not trust client-supplied MIME type or file name. |
| payments/webhook_events | provider, provider_event_id, internal reference, amount, currency, status | Unique provider event ID; idempotent webhook processing. |
| reports/audit_logs | reporter, target, reason, action, actor, timestamp | Restricted access; record consequential admin actions. |

### Critical transaction rules

- RSVP: enforce capacity in a database transaction with an appropriate row lock or atomic conditional update; do not rely on a prior client-side count.
- Payments: calculate prices server-side; verify webhook signatures; use idempotency keys; never mark a booking paid based only on a mobile redirect.
- Authorisation: every protected API route checks the authenticated user and resource-level permission; hiding a button is not authorisation.
- Dates: store timestamps in UTC and preserve the event's IANA timezone for display and local scheduling.
- GPX and images: enforce file size, content-type allowlists, ownership checks and safe download URLs.
- Concurrency: use unique constraints and transactions to prevent duplicate memberships, RSVPs and payment event processing.

## 6. API design

Use a documented REST API under /api/v1. Generate or maintain an OpenAPI specification and validate request DTOs on the server. Keep response formats consistent and avoid exposing database records directly.

| Example endpoint | Purpose | Access |
| --- | --- | --- |
| GET /api/v1/rides | Browse rides with filters, cursor pagination and sort. | Public subset; private fields excluded. |
| GET /api/v1/rides/{id} | Read ride detail and route summary. | Visibility policy applies. |
| POST /api/v1/rides | Create ride. | Authenticated approved organiser. |
| POST /api/v1/rides/{id}/rsvps | Join a ride. | Authenticated; capacity enforced server-side. |
| DELETE /api/v1/rides/{id}/rsvps/me | Cancel own RSVP. | Authenticated; cancellation rules apply. |
| GET /api/v1/clubs/{slug} | Read club and upcoming rides. | Public subset. |
| POST /api/v1/trips/{id}/enquiries | Enquire about a trip. | Authenticated or rate-limited public form, per product choice. |
| POST /api/v1/media/upload-intents | Request signed upload URL. | Authenticated; validate purpose and limits. |
| POST /api/v1/payments/webhooks/{provider} | Receive provider event. | Provider signature validation; idempotent. |
| POST /api/v1/reports | Report content or user. | Authenticated; rate-limited. |

### API conventions

- Cursor pagination for growing lists; avoid unbounded list endpoints.
- Consistent error envelope with stable machine-readable code, human-readable message and request ID.
- Validate all input on the server; use allowlists for sort and filter fields.
- Rate-limit login-adjacent actions, posting, reports, upload intents and enquiry endpoints.
- Never return auth provider secrets, payment secrets, private contact details or internal moderation notes.
- Use idempotency keys for booking/payment initiation where duplicate requests could charge or reserve twice.
- Document authentication, scopes/roles, error codes, pagination and example payloads in OpenAPI.

## 7. Security, privacy and safety

### Minimum security baseline

- Managed identity provider; no custom password storage.
- Short-lived access tokens and provider-supported refresh/session handling.
- JWT signature, issuer, audience and expiry validation on the API.
- Role-based and resource-based access controls for member, organiser, moderator and admin.
- Secrets only in server-side environment configuration/secret manager; no secrets in Git or app bundle.
- HTTPS everywhere; restrictive CORS for future web clients; security headers on web-facing endpoints.
- Rate limits and abuse protection; sanitised logging; no tokens or payment data in logs.
- Dependency scanning, lockfile discipline, automated tests and periodic security review.
- Encrypted backups, restore test, data retention policy and incident-response runbook.
- Payment provider hosted checkout or tokenised flow; do not store raw card details.

### Location privacy and rider safety

- Do not implement live rider location in MVP.
- Use approximate member location (city/district or user-selected area) for buddy discovery; never show a home address.
- Allow users to control profile visibility and what appears to non-members.
- For sensitive/private rides, require membership or RSVP before disclosing exact meeting instructions.
- Provide block, report, moderator review and account restriction workflows.
- Make clear that ride difficulty and GPX data are user/organiser supplied and not a guarantee of route safety.
- Provide ride organiser guidance for weather, road/trail permissions, equipment and emergency contact procedures.

Before launch, obtain appropriate advice on Thailand PDPA and other target-market privacy and consumer rules. Trip sales may trigger additional obligations depending on whether the platform is a listing service, booking intermediary, agent or tour operator.

## 8. Non-functional requirements

| Area | Initial target / requirement |
| --- | --- |
| Performance | Common API reads should usually return within 500 ms at the application layer under expected MVP load; measure p95 rather than promise universal latency. |
| Availability | Use managed services and basic monitoring; establish an explicit target after hosting and support commitments are chosen. |
| Accessibility | Readable text, scalable font, screen-reader labels, touch targets and sufficient contrast. |
| Compatibility | Support current and recent iOS/Android versions chosen at project start; test physical devices. |
| Observability | Structured logs, request IDs, crash/error reporting and basic usage analytics with privacy controls. |
| Backups | Automated database backups according to provider capabilities; document and test restoration. |
| Recovery | Document recovery steps and define acceptable data loss/recovery time with the business owner. |
| Localization | Prepare translation-ready strings; launch in English, and add Thai or other languages based on launch audience. |
| Time and currency | Store time consistently; preserve event timezone; make currency explicit on each paid product. |
| Maintainability | TypeScript strict mode, linting, formatting, migrations, tests and architecture documentation. |

## 9. Environments, delivery and operations

### Environments

| Environment | Purpose | Rules |
| --- | --- | --- |
| Local | Developer iteration | Seeded synthetic data; no production secrets or personal data. |
| Development / preview | Feature branches and integration | Temporary or shared test services; test payments only. |
| Staging | Release candidate and acceptance testing | Production-like configuration; separate database and credentials. |
| Production | Real users and payments | Restricted access, backups, alerts, change control and rollback procedure. |

### CI/CD baseline

- Pull request checks: formatting, lint, typecheck, unit tests, API tests and build.
- Database schema changes through reviewed, versioned migrations; avoid destructive migration without a documented rollout.
- Deploy API and mobile release candidates independently.
- Use EAS Build/Submit or a documented equivalent for signed mobile builds; keep signing credentials secure.
- Use feature flags or server-side configuration for unfinished or staged features.
- Document rollback steps for API releases and database changes.

### Operational ownership

The technical founder owns deployments, monitoring, backups, incident response and vendor configuration. The community founder owns content quality, organiser relationships, event disputes and day-to-day community moderation. Both should agree who is on point for payment issues, safety incidents and privacy requests.

## 10. Delivery roadmap and effort

| Phase | Indicative duration | Deliverable / exit gate |
| --- | --- | --- |
| 0. Discovery | 1–2 weeks | Confirmed launch city, interviews, product requirements, provider decisions, wireframes and signed founder agreement. |
| 1. Foundation | 2–3 weeks | Monorepo, environments, auth, database migrations, API conventions, design system and CI. |
| 2. Core rides | 3–4 weeks | Profiles, ride listing/detail, organiser creation, RSVP/capacity and GPX handling. |
| 3. Community/trips | 2–3 weeks | Clubs, posts/comments, reporting/moderation, destination pages and trip enquiry. |
| 4. Commercial hardening | 2–3 weeks | One paid flow, webhook handling, email notifications, analytics, QA and security checks. |
| 5. Pilot and release | 2 weeks | Closed beta, app store assets, bug fixing, support runbook and public launch. |

Indicative total: about 12–17 weeks for a focused MVP with a developer working consistently and timely input from the community founder. A solo developer balancing other work may need materially longer. Native mobile delivery also depends on app-store review and account setup.

### Recommended release gates

- Gate A — Demand: at least 3–5 launch organisers agree to publish real rides and help test.
- Gate B — Core workflow: member can discover and RSVP; organiser can publish and manage a ride.
- Gate C — Safety: permissions, report/block, moderation and privacy checks pass.
- Gate D — Commercial: one end-to-end payment or booking flow is tested with provider sandbox and failure cases.
- Gate E — Release: crash-free test sessions, critical bugs resolved, backups and support process verified.

## 11. Budget and operating assumptions

Planning estimates in Thai baht. These are budgeting ranges, not vendor quotations. They assume the founder performs most engineering work and exclude the economic value of founder labour.

| Cost area | Indicative allowance | Notes |
| --- | --- | --- |
| Brand/UI design support | ฿25,000–60,000 | Can be reduced if founder designs initial screens; avoid copying reference branding. |
| Legal and business setup advice | ฿20,000–60,000 | Founder agreement, privacy/terms and initial market-specific review. |
| External QA/security review | ฿20,000–50,000 | Prioritise authentication, authorisation, payment and upload flows. |
| Launch assets/content | ฿5,000–20,000 | App store screenshots, photography, onboarding and launch material. |
| Integration/launch contingency | ฿20,000–60,000 | Provider setup, testing devices, unforeseen issues and initial fixes. |
| Initial cash planning range | ฿90,000–250,000 | Excludes founder labour, ongoing marketing, company overhead and tax. |
| Reserve for early operations | ฿30,000–80,000 | Support, fixes, partner onboarding and post-launch iteration. |

A reasonable initial funding envelope is approximately ฿120,000–330,000, excluding founder labour. Re-estimate after discovery and a clickable prototype. Monthly infrastructure and third-party charges depend on usage, provider tiers, mapping, media storage, email, monitoring and payment fees; set budget alerts before launch.

### Commercial validation before major spend

- Get launch organisers committed before paying for advanced features.
- Test whether partners will pay for a listing or sponsored placement.
- Choose one initial paid transaction and document refunds/cancellations before implementation.
- Track founder hours separately from cash expenditure to understand true cost and future hiring needs.

## 12. Risks and mitigations

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Cold start / no rides | High | Recruit clubs first, seed real events and appoint community champions. |
| Scope creep | High | Enforce MVP exclusions and require explicit approval for new scope. |
| Founder disagreement | High | Written agreement for equity/fees, IP, responsibilities, decisions and exit. |
| Location/privacy incident | High | Approximate location only, visibility controls, no live location in MVP. |
| Ride safety incident | High | Guidelines, organiser responsibilities, incident response and insurance review. |
| Payment or booking error | High | Server-verified webhooks, idempotency, reconciliation and clear refund policy. |
| Abuse and spam | High | Rate limiting, report/block, moderation queue, verification options and audit trail. |
| Vendor dependency | Medium | Document adapters, export data, use standard PostgreSQL and avoid unnecessary lock-in. |
| Mobile release delays | Medium | Test early on real devices, establish developer accounts and prepare store assets. |
| Low revenue | High | Validate sponsor/organiser willingness to pay and track retention before expanding. |

## 13. Claude Code working agreement

Claude Code should be treated as an implementation assistant, not an autonomous product owner. It must inspect the existing workspace, propose a staged plan, identify unknowns, and then implement small verified increments. If there is an existing repository, it must preserve and understand it rather than replace it.

- Do not generate the entire product in one unreviewed pass.
- Do not assume provider accounts, environment variables, API keys or app-store credentials exist.
- Do not store secrets in source control or mobile bundles.
- Do not implement payments until the business owner selects the transaction model and gateway.
- Do not silently change the agreed stack or introduce new services without explaining the trade-off.
- Run lint, typecheck, tests and builds for each meaningful increment; report failures honestly.
- Create/maintain README, architecture decision records, environment example file, API specification and setup instructions.
- Use realistic synthetic seed data, never real member data in development.

## 14. Detailed Claude Code prompt

Copy the following prompt into Claude Code from the project root. It is written to force a discovery and planning stage before code changes, then implement the product incrementally.

> The full prompt is kept verbatim in [claude-code-prompt.md](claude-code-prompt.md).

## 15. Questions to resolve before implementation

| Decision | Recommended default | Why it matters |
| --- | --- | --- |
| Launch geography | One city/community first | Determines seed rides, language, partners and launch content. |
| Authentication provider | Managed provider with Expo support | Impacts mobile session handling and API JWT validation. |
| First paid transaction | Paid event registration OR trip deposit | Determines payment workflow, refunds and legal responsibilities. |
| Trip business role | Start as discovery/enquiry or clearly defined booking intermediary | Avoid accidentally assuming tour-operator obligations. |
| Maps provider | Choose after pricing and regional coverage review | Maps, routing and geocoding have different costs. |
| Languages | English-ready architecture; launch languages chosen by audience | Avoid reworking UI strings later. |
| Admin interface | Minimal protected web console alongside API | Moderation and support are difficult to operate through a mobile app alone. |
| Founder agreement | Document before meaningful build investment | Clarifies IP, costs, authority and exit arrangements. |

## 16. Final recommendation

Proceed with a mobile-first product, but keep the architecture API-first. Use Expo/React Native for the client, a TypeScript backend and PostgreSQL for authoritative business data, and managed services for identity, media and payments. Build the ride-discovery and RSVP journey before broad community features, and validate a single commercial workflow before introducing complex booking operations.

The next action is to run the Claude Code prompt from the intended repository, review its audit and plan, resolve provider decisions, and approve the first implementation increment. Do not commit to the full roadmap or budget until the workspace, available development time and MVP requirements have been confirmed.
