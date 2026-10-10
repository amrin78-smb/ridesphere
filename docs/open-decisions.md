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
| 10 | Email provider | Resend (free tier), or Cloudflare Email Service if the account moves to Workers Paid | Email verification, password reset, email notifications | Leaning Resend; waiting on decision 21 |
| 21 | Domain name | Buy once the brand name is cleared (decision 17). Needed to send email to members, and for a production API address and store listings | Sending email to real users, production URL | Open: no domain yet |
| 19 | Cloudflare Workers plan before launch | Move to Workers Paid before real users, or load-test password hashing on the free plan first | Reliability of sign-in | Open. Free plan for now, which is fine for testing |
| 20 | Sign-in on iOS at launch | Either offer email and password only on iOS, or add Sign in with Apple before the App Store submission | iOS release | Open. Apple's review guideline 4.8 expects an app that offers Google sign-in to also offer an equivalent option such as Sign in with Apple |
| 11 | Launch languages | English first, strings translation-ready | Localisation effort | Open |
| 12 | Admin interface | Admin API first, minimal web console behind Cloudflare Access next | Moderation operations | Open |
| 13 | Data retention policy when an account is deleted | See proposals in the [data inventory](privacy/data-inventory.md). Deletion is immediate and total for now | Community, RSVP and booking features; privacy policy | Open. Not urgent until member content exists |
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
| 2026-10-10 | Sign-in methods: email and password, plus Google and Apple | Owner ("if free, proceed"). Google sign-in has no fee. Apple sign-in has no fee of its own but needs the Apple Developer Program (USD 99 a year), which publishing to the App Store requires anyway |
| 2026-10-10 | Commit finished work and push directly to `main` | Owner |
| 2026-10-10 | Apple sign-in dropped for now; sign-in is email and password plus Google. Supersedes the row above | Owner. See open decision 20 for the iOS consequence |
| 2026-10-10 | Cloudflare free plan while testing | Owner |
| 2026-10-10 | Google OAuth client created and set on staging (was decision 18) | Owner |
| 2026-10-10 | Staging environment on Cloudflare (Worker `ridesphere-api-staging`, Neon `staging` branch) | Owner asked to publish for testing |
