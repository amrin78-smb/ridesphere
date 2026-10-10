# Data inventory

Status: planned data, written before implementation. Update it in the same change that adds or alters a personal data field, and whenever a provider is added.

This is an engineering record. It is not legal advice and does not by itself make RideSphere compliant with Thailand's PDPA or any other law. Get qualified advice on lawful basis, consent wording, cross-border transfer and retention before launch.

## Principles

- Collect only what a feature needs.
- Location is coarse and chosen by the member. No addresses, no live or background location.
- Members control profile visibility.
- Development and staging use synthetic data only.

## Personal data held by RideSphere

| Data | Where | Purpose | Visible to | Proposed retention |
| --- | --- | --- | --- | --- |
| Email address | Auth tables | Sign-in, transactional email | Member, admins | Life of account |
| Password hash | Auth tables | Sign-in | Nobody; never returned or logged | Life of account |
| Sessions (token, IP address, user agent), verification tokens | Auth tables | Keeping members signed in, recovery | Internal | Until expiry or sign-out |
| Linked Apple or Google account IDs | Auth tables | Social sign-in, if enabled | Internal | Life of account |
| Display name, avatar | `users`, R2 | Identity in the community | Per profile visibility | Life of account |
| Home area (city or district), locale, languages | `users` | Ride and buddy discovery | Per profile visibility | Life of account |
| Bike types, riding styles, pace, experience, distance range | `user_preferences` | Matching rides | Per profile visibility | Life of account |
| Club memberships and roles | `club_memberships` | Permissions, club pages | Club members; public if the club is public | Life of membership, then removed |
| RSVPs and attendance history | `ride_rsvps` | Capacity, participant lists | Organiser; participants per ride rules | To be decided |
| Posts, comments, reactions | `posts`, `comments`, `reactions` | Community | Per content visibility | Until deleted by author or moderation |
| Photos | `media_assets`, R2 | Profiles, rides, posts | Per parent content | With parent content |
| GPX files | `media_assets`, R2 | Route sharing | Per ride visibility | With the ride |
| Blocks | `blocks` | Safety | The blocker only | Life of account |
| Reports | `reports` | Moderation | Moderators, admins | To be decided; long enough to handle repeat abuse |
| Moderation actions, audit log | `audit_logs` | Accountability | Admins | To be decided |
| Trip enquiries | `trip_enquiries` | Passing interest to the organiser | Member, trip organiser, admins | To be decided |
| Bookings and payment references | `trip_bookings`, `payments` | Fulfilment, reconciliation, refunds | Member, admins | As tax and accounting rules require |
| Push tokens | `push_tokens` | Push notifications | Internal | Until sign-out, token invalidation or deletion |
| Notification preferences | `notification_preferences` | Respecting choices | Member | Life of account |
| IP address, user agent | Request logs | Security, abuse control | Technical founder | Short log retention; confirm against the Cloudflare plan |

Never collected: home address, precise or live location, government ID, card numbers, health data.

GPX tracks and photos can carry location even though RideSphere does not ask for it. Photo EXIF data is stripped before upload, and organisers are told that a GPX file shows exactly where a route starts.

## Processors and where data goes

| Processor | Data | Region | Status |
| --- | --- | --- | --- |
| Cloudflare (Workers, R2, Hyperdrive, logs) | All API traffic, media | Global edge; R2 location set per bucket | Chosen |
| Neon | All database content, including credentials and sessions | AWS Singapore (ap-southeast-1) | Chosen |
| Apple, Google (sign-in) | Identity assertion, if social sign-in is enabled | Vendor-determined | Undecided |
| Email provider | Email address, message content | To be confirmed | Not selected |
| Expo push service, Apple, Google | Push token, notification content | Vendor-determined | Planned |
| Maps provider | Map tile requests, possibly device IP | To be confirmed | Not selected |
| Error reporting | Stack traces, device info, user ID | To be confirmed | Planned |
| Payment gateway | Payer details, card data (never seen by RideSphere) | To be confirmed | Not selected |

Member data will leave the member's country under most of these choices. Cross-border transfer needs to be addressed in the privacy policy and reviewed by an adviser.

Keep notification content minimal. Push messages must not contain exact meeting points of private rides.

## Member rights

To be supported by product features or a documented manual process:

- **Access and export.** Manual process initially; the technical founder runs an export on request.
- **Correction.** Profile editing in the app.
- **Deletion.** In-app account deletion, which both app stores require.
- **Withdrawing consent.** Notification and visibility settings.

## Proposed account deletion behaviour

Owner to confirm (open decision 13):

1. The account is deactivated at once and disappears from the app.
2. After a short grace period the profile, preferences, avatar, push tokens, blocks and future RSVPs are erased, and the auth records (credentials, sessions, linked accounts) are deleted.
3. Posts and comments are either removed or kept with the author shown as a deleted member. This is a product choice to make explicitly.
4. Booking and payment records are kept for as long as accounting rules require, detached from the profile.
5. Audit and moderation records are kept with the user reference pseudonymised.
6. Backups age out according to the retention window in the [backup runbook](../runbooks/backup-restore.md).

## Privacy requests and incidents

The founders must name who receives privacy requests and who leads on a suspected breach. A breach procedure, including notification duties and deadlines under applicable law, needs to be written with an adviser before launch.
