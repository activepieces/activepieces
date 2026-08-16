---
status: accepted
---

# Email sign-in is a typed code on the existing OTP primitive, not a second subsystem

## Decision
Passwordless sign-in adds a third `OtpType`, `EMAIL_LOGIN`, and reuses `otpService.createAndSend` / `.confirm` rather than introducing a parallel one-time-credential mechanism. The credential is a 6-digit code the member types, never a clickable link. It reaches every edition, but the UI only offers it when `ApFlagId.SMTP_CONFIGURED` is true; password sign-in stays the default path everywhere else.

## Context
Main already carries the whole emailed-code mechanism: a `PENDING`/`CONFIRMED` state machine, a unique index on `(identityId, type)`, a public request endpoint, and an emailed delivery path. What it lacked was shape and reach. The value was a `randomUUID()` delivered as a magic link, there were only two `OtpType` members, `otpModule` was registered for CLOUD and ENTERPRISE only, `sendOtp` returned early when `EDITION_IS_NOT_PAID`, and there was no code-entry UI on the web at all.

A vibe-coded branch built this as new machinery and regressed three properties in the process, which is what forced the calls below.

## Why

**A typed code, not a link.** [000009](./000009-approval-links-require-a-post-confirmation-on-a-dedicated-route.md) established that Microsoft Safe Links, Mimecast and Proofpoint pre-fetch emailed URLs with a GET that is indistinguishable from a human click. A single-use sign-in link is consumed by that prefetch, so the member's own click lands on an expired credential. A typed code sidesteps the whole class. Shipping a link would mean rebuilding 000009's GET-page plus POST-confirm shape for auth.

**Reach is gated on SMTP, not on edition.** `emailSender` silently falls back to `logEmailSender` when SMTP is unset, so an all-editions rollout without a gate is exactly the "looks enabled, silently broken" failure `.claude/rules/self-hosting.md` forbids. Gating on the already-public `SMTP_CONFIGURED` flag means a CE instance without SMTP sees no change at all, and one with SMTP gets the feature for free. No new flag, and `EMAIL_LOGIN` is the only type carved out of the paid-edition delivery gate.

**A code request never becomes an oracle.** The three signup asserts split by what they reveal. `assertEmailAuthIsEnabled` and `assertDomainIsAllowed` are properties of platform configuration and throw distinct errors, because knowing them tells an attacker nothing about a specific address. `assertUserIsInvitedToPlatformOrProject` reveals whether *that* address was invited, so an un-invited request returns the same 204 as success, sends nothing, and creates nothing. This mirrors the silent return `createAndSend` already uses for unknown emails.

**Brute force is capped per credential, not per IP.** A 6-digit code is a 10^6 space, and `confirm` compared plaintext with no attempt counter while the request endpoint carried no rate-limit config. Rate limiting alone does not bound a distributed attacker, so the row now carries an `attempts` counter and dies on the fifth wrong guess. Rate limits go on both endpoints as well, but the counter is what makes the budget five guesses per issued code regardless of how the requests are spread.

**Resend delivers the same code, it does not mint a new one.** One `TEN_MINUTES` constant served as both the expiry and the resend suppression, so `createAndSend` returned without sending until the existing code expired. That is a spam guard for a link and a ten minute lockout for a code that landed in spam. Resend now re-sends the existing value and leaves `updated` alone, so the original expiry still governs and both emails carry the same code. Minting a fresh code per resend was rejected because members type the first code they see, so reissuing invalidates the one half of them are already reading.

**Verifying a code lands the member in the product, with no naming step.** Today a brand-new Cloud identity gets an ONBOARDING response and has to name its platform at `/create-platform` before it can do anything. The code path skips that: on Cloud, when the verified identity belongs to no platform, `verifyCode` creates one through `createPlatformWithProject` with a name derived from the email local part, and returns a full session. Renaming stays available in settings. This is Cloud-only by construction, because self-hosted sign-up takes the other `signUp` arm and joins the platform that already exists. It also means the passwordless path never mints an ONBOARDING principal; that window remains only for the password and federated paths.

**The OTP module moves out of `ee/`.** Making `EMAIL_LOGIN` all-editions makes the primitive all-editions, so `ee/authentication/otp/` becomes `authentication/otp/` (four importers). This clears a standing `.claude/rules/edition-safety.md` violation rather than adding a second one, and it removes the trap the directory name set: the brain page already asserted "CE gets OTP flows" while the module was registered for Cloud and Enterprise only. A `hooksFactory` seam was rejected as one interface with one implementation around a primitive every edition now runs.

## Consequences
An identity is created before ownership is proven, the member's name is a guess, and the resend window behaves differently.

- **`firstName` is derived from the email local part, knowingly as a placeholder.** A code sign-up asks for no name, so the local part is capitalised and stored. This is wrong for shared and role addresses (`info@` becomes "Info") and for single-letter local parts, and the guess persists as the member's real name. Accepted deliberately to keep the first cut shippable, with the derivation to be replaced later rather than left to rot. Nothing else depends on it: platform naming derives from the local part directly, not from `firstName`.

- `requestCode` creates a `UserIdentity` with `verified: false` and a random password when none exists, because the `otp` row needs an `identityId` to hang on. So an unauthenticated endpoint can create rows. `ApFlagId.USER_CREATED` is deliberately NOT set until a code verifies, and both endpoints are rate limited. Never-verified identities need a prune story.
- `confirm` now deletes the row instead of marking it `CONFIRMED`. This is also a bug fix for the two existing types: `updated` is an `updateDate` column, so marking the row refreshed it and the ten-minute guard then blocked that identity from requesting another code for ten minutes after a successful use.
- **The attempt counter is incremented with a bare `UPDATE ... SET attempts = attempts + 1 RETURNING attempts`, not through the repository.** Two reasons, both found in review. TypeORM's `update` touches `updated`, the very column the expiry and resend-suppression checks read, so counting a wrong guess would have extended the credential's life by ten minutes per guess. And a read-modify-write increment lets concurrent verifies write the same value, so the five-guess budget would never be reached under a parallel attack.
- **`OtpState.CONFIRMED` is now written by nothing.** It survives only as the `otpIsPending` read, which still correctly rejects legacy rows a previous build left CONFIRMED. Retire the member once those rows have aged past the ten-minute window.
- **The public `POST /v1/otp` route must never accept `EMAIL_LOGIN`.** Adding the member to `OtpType` silently widened that unauthenticated, unthrottled, unguarded route into a way to email anyone a working sign-in code, so `CreateOtpRequestBody` now narrows `type` to the two link types.
- **`verifyCode` re-asserts the platform auth policy on the resolved platform.** On Cloud, `getPlatformIdForRequest` returns null for unauthenticated requests, so the request-scoped branch never runs there; without a second assert an email code would sign a member into a platform that had deliberately disabled email auth or removed their domain from the allow-list. Deliberately not asserted at request time, since surfacing those errors per address would rebuild the existence oracle this design closes.
- An un-invited member on an invitation-only instance is told "check your email" and no mail arrives. Accepted in exchange for closing the invitation oracle.
- Adding an `OtpType` member is a forced compile break in `email-service.ts`, whose `frontendPath` is a two-key literal indexed by the full union. Its sibling `otpToTemplate` is typed `Record<string, EmailTemplateData>`, so it type-checks while handing `undefined` to the sender at runtime. Both are replaced by one exhaustive switch.
