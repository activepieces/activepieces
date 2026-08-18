---
icon: 🔑
---

# CE Authentication

The core (all-editions) auth layer: user identity creation, sign-in, and JWT session management. Supports email/password, federated OAuth (Google, SAML), and invitation-only sign-up. On first sign-up (no `platformId`) a new platform + personal project are auto-created.

### Entities & services
- **UserIdentity** (`user_identity`): email + bcrypt password + provider record, one per email, shared across platforms. Holds `tokenVersion` (rotating it invalidates all JWTs), `verified`, provider, avatar.
- **User**: platform-specific record linking an identity to a platform + role.
- `authenticationService`: `signUp`, `signInWithPassword`, `federatedAuthn` (OAuth/SAML callbacks), `switchPlatform`.
- `accessTokenManager`: `generateToken` (7-day JWT), `generateEngineToken`/`generateWorkerToken` (long-lived), `verifyPrincipal` (checks tokenVersion + active status).

### How it works
- Token is a short-lived JWT (7 days) signed with a shared secret. `PrincipalType`: USER, ENGINE, WORKER, SERVICE, UNKNOWN, ONBOARDING.
- Endpoints (all rate-limited via `API_RATE_LIMIT_AUTHN_*`): `POST /v1/authentication/sign-up`, `/sign-in`, `/switch-platform`.
- First sign-up side effects: creates identity → User (PlatformRole.ADMIN) → default PERSONAL project; sends OTP on Cloud prod, auto-verifies otherwise; fires `USER_CREATED` flag + `SIGNED_UP` telemetry.
- **`signUp` has two arms and only one of them can create a platform.** When `params.platformId` is set (self-hosted, or a custom domain) the member joins that existing platform through `getOrCreateWithProject` and no platform is ever created or named. When it is nil (Cloud only) the identity is created first, then `getPreferredPlatformId` looks for a platform the identity already belongs to; finding none it returns an ONBOARDING response, and the member names the platform themselves at `/create-platform`. `getPreferredPlatformId` returns null on every non-Cloud edition. There is no `"<firstName>'s Platform"` autoname in production; that string lives only in `dev-seeds.ts`.
- **ONBOARDING** is the pre-platform principal: `authenticationUtils.getOnboardingResponse` mints it with `platformId: null, projectId: null` for a verified identity that belongs to no platform yet, so the member can call `POST /v1/platforms` (`securityAccess.unscoped([ONBOARDING, USER])`) and land on `/create-platform`. It is Cloud-only in practice, because on self-hosted `platformUtils.getPlatformIdForRequest` falls back to `getOldestPlatform()` and there is always a platform to join. `accessTokenManager.assertUserSession` still revalidates it against `tokenVersion` + `verified`.
- **Passwordless sign-in** (`EMAIL_LOGIN`) is a typed 6-digit code on the same OTP primitive, offered only when `ApFlagId.SMTP_CONFIGURED` is true, with password as the fallback path. See [000027](../decisions/000027-email-sign-in-is-a-typed-code-on-the-existing-otp-primitive.md) for the code-not-link, edition-reach and anti-enumeration reasoning.

### Gotchas
- Email-auth checks and domain allow-listing guards are **skipped on Community** edition.
- OTP verification only sent on Cloud production; CE/EE and Cloud-dev (`AP_ENVIRONMENT=development`) auto-verify the identity.
- Telemetry PII (email/name) sent only on Cloud; CE/EE send non-PII fields (`pickTelemetryPii`). Sign-in telemetry covers password sign-in only, not SSO.
- Sessions are invalidated by rotating `tokenVersion` on `UserIdentity`.
- **A new unauthenticated endpoint must be added to `disallowedRoutes` in `packages/web/src/lib/api.ts`**, otherwise the SPA attaches whatever stale bearer token is still in storage and the call fails in exactly the situation the endpoint exists for.
- **The three signup guards in `authentication-utils.ts` differ in what they leak.** `assertEmailAuthIsEnabled` and `assertDomainIsAllowed` describe platform configuration, so surfacing their errors is safe. `assertUserIsInvitedToPlatformOrProject` describes one address, so surfacing it turns any public auth endpoint into an invitation oracle. All three are also inert unless `plan.ssoEnabled`.
- **A nil `projectId` on the principal means "go to /create-platform" in four separate places.** Anything that mints a platform-less session has to satisfy all of them, not just the route guard.
- **The route no longer decides sign-in vs sign-up — the card does.** `/sign-in`, `/sign-up` and `/create-platform` all render the same `AuthLanding`; `/sign-up` is a bare redirect to `/sign-in`. Which form you get is a function of two flags: with `SMTP_CONFIGURED` the card opens on the email-code step and the classic password form exists *only* behind the "Use password" link; without it you land on a password form directly, and `USER_CREATED` picks sign-up (first ever account, no mode switch offered) over sign-in. So the same URL renders three different DOMs across Cloud, a seeded self-host, and a fresh install — anything scripting this screen has to branch, and password sign-*up* is simply unreachable once SMTP is on.
- **`/create-platform` is that same card opening on its name step**, off the ONBOARDING token rather than a route param — submitting the name is what mints the platform and project and swaps ONBOARDING for USER. A brand-new account therefore needs *two* form submissions before it has a project, which is easy to miss when automating first-run signup.

### Key files
Entry point: `authenticationService`, a log-taking factory called per request from `authentication.controller.ts`, registered as `authenticationModule` in `app.ts`.

- `packages/server/api/src/app/authentication/` — the whole server slice: module, controller (routes), service, shared guards in `authentication-utils.ts`, `authorization.ts`
- `packages/server/api/src/app/authentication/lib/` — `access-token-manager.ts` (JWT generate/verify) and `password-hasher.ts` (bcrypt)
- `packages/server/api/src/app/authentication/user-identity/` — `user_identity` entity and identity CRUD service
- `packages/core/shared/src/lib/core/authentication/` — shared zod contracts: `dto/` sign-in, sign-up, authentication-response, plus `model/`
- `packages/web/src/features/authentication/` — SPA feature: `hooks/auth-hooks.ts` React Query mutations, `components/` sign-in, sign-up, third-party and SAML logins, reset/verify
- `packages/web/src/app/routes/auth-routes.tsx` — route declarations: /sign-in, /sign-up, /forget-password, /reset-password, /verify-email, /invitation

Paths verified 2026-07-17.
