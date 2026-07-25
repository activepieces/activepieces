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
- Token is a short-lived JWT (7 days) signed with a shared secret. `PrincipalType`: USER, ENGINE, WORKER, SERVICE, UNKNOWN.
- Endpoints (all rate-limited via `API_RATE_LIMIT_AUTHN_*`): `POST /v1/authentication/sign-up`, `/sign-in`, `/switch-platform`.
- First sign-up side effects: creates identity → User (PlatformRole.ADMIN) → Platform (`"<firstName>'s Platform"`) → default PERSONAL project; sends OTP on Cloud prod, auto-verifies otherwise; fires `USER_CREATED` flag + `SIGNED_UP` telemetry.

### Gotchas
- Email-auth checks and domain allow-listing guards are **skipped on Community** edition.
- OTP verification only sent on Cloud production; CE/EE and Cloud-dev (`AP_ENVIRONMENT=development`) auto-verify the identity.
- Telemetry PII (email/name) sent only on Cloud; CE/EE send non-PII fields (`pickTelemetryPii`). Sign-in telemetry covers password sign-in only, not SSO.
- Sessions are invalidated by rotating `tokenVersion` on `UserIdentity`.

### Key files
Entry point: `authenticationService`, a log-taking factory called per request from `authentication.controller.ts`, registered as `authenticationModule` in `app.ts`.

- `packages/server/api/src/app/authentication/` — the whole server slice: module, controller (routes), service, shared guards in `authentication-utils.ts`, `authorization.ts`
- `packages/server/api/src/app/authentication/lib/` — `access-token-manager.ts` (JWT generate/verify) and `password-hasher.ts` (bcrypt)
- `packages/server/api/src/app/authentication/user-identity/` — `user_identity` entity and identity CRUD service
- `packages/core/shared/src/lib/core/authentication/` — shared zod contracts: `dto/` sign-in, sign-up, authentication-response, plus `model/`
- `packages/web/src/features/authentication/` — SPA feature: `hooks/auth-hooks.ts` React Query mutations, `components/` sign-in, sign-up, third-party and SAML logins, reset/verify
- `packages/web/src/app/routes/auth-routes.tsx` — route declarations: /sign-in, /sign-up, /forget-password, /reset-password, /verify-email, /invitation

Paths verified 2026-07-17.
