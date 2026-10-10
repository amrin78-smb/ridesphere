# Mobile release checklist

Copy this list into the release pull request or issue and tick it there. Items that do not apply yet (payments, maps) are marked as such rather than deleted.

## Before the first release only

- [ ] Apple Developer and Google Play developer accounts in the company's name
- [ ] Bundle identifier and package name fixed; brand name cleared (open decision 17)
- [ ] EAS project created; signing credentials stored in EAS, not in Git
- [ ] App icons, splash screen, store screenshots, descriptions
- [ ] Privacy policy and terms of service published at stable URLs
- [ ] App Store privacy labels and Google Play data safety form match the [data inventory](../privacy/data-inventory.md)
- [ ] Sign in with Apple offered if any other social login is offered
- [ ] In-app account deletion works end to end
- [ ] Report and block available on user-generated content, with a published moderation contact
- [ ] Age rating questionnaires completed
- [ ] Permission prompts have clear purpose strings (photos, camera, notifications)
- [ ] No location permission requested beyond what a shipped feature needs; no background location
- [ ] Support contact and support process in place

## Every release

### Build

- [ ] Version and build number increased
- [ ] Release notes written
- [ ] Production API URL and publishable keys only; no staging endpoints, no secrets in the bundle
- [ ] Lint, typecheck and tests pass in CI
- [ ] API version in production supports this build, and still supports the previous store build
- [ ] Debug menus and seed data absent from the production build

### Device testing

Test on at least one physical iPhone and one physical Android phone, including a small screen and one older supported OS version.

- [ ] Fresh install: register, complete profile
- [ ] Sign out, sign in, restore session after restarting the app
- [ ] Expired session returns to sign-in without a crash and resumes afterwards
- [ ] Deep link while signed out
- [ ] Browse rides, filter, pull to refresh, paginate
- [ ] Ride detail with a map key, and with the map unavailable (fallback shown)
- [ ] GPX download
- [ ] RSVP, cancel, full ride, duplicate RSVP attempt
- [ ] Private ride hides exact meeting details until authorised
- [ ] Organiser creates and edits a ride
- [ ] Club page and membership
- [ ] Post, comment, react, upload a photo, upload failure
- [ ] Report content, block a user, blocked content disappears
- [ ] Trip page and enquiry
- [ ] Paid flow in the sandbox, including failure and cancel — not applicable until payments are approved
- [ ] Push notification received and opens the right screen
- [ ] Aeroplane mode and poor network: clear offline state, retry works
- [ ] API error shows a useful message, not a blank screen

### Quality

- [ ] Screen reader pass on the main journeys (VoiceOver and TalkBack)
- [ ] Largest system text size does not break layouts
- [ ] Contrast and touch target sizes acceptable
- [ ] Keyboard does not cover inputs; safe areas respected
- [ ] Cold start time and scrolling acceptable on the older test device
- [ ] No crashes across the test session; error reporting received a test event

### Submit

- [ ] Build submitted through EAS Submit
- [ ] Review notes include a demo account with synthetic data
- [ ] Phased rollout enabled
- [ ] Rollback plan known: pause rollout, server-side flag, expedited fix (see [deployment and rollback](../runbooks/deployment-and-rollback.md))

### After release

- [ ] Watch crash-free sessions and API error rate for 48 hours
- [ ] Check store reviews and support inbox
- [ ] Update the [feature matrix](../feature-matrix.md)
