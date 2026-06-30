# CE Authentication

## Summary
The authentication feature handles user identity creation, sign-in, and JWT session management across all editions. It supports email/password credentials, federated OAuth providers (Google, SAML), and invitation-only sign-up when a platform is configured. On first sign-up (no `platformId`), a new platform and personal project are created automatically. The token is a short-lived JWT (7 days) signed with a shared secret, and sessions are invalidated by rotating the `tokenVersion` on the `UserIdentity` record.

## Key Files
- `packages/server/api/src/app/authentication/authentication.controller.ts` — Fastify routes: POST /sign-up, POST /sign-in, POST /switch-platform
- `packages/server/api/src/app/authentication/authentication.service.ts` — core service: `signUp`, `signInWithPassword`, `federatedAuthn`, `switchPlatform`
- `packages/server/api/src/app/authentication/authentication-utils.ts` — shared guards (domain check, email auth check, invitation check) and `getProjectAndToken` helper
- `packages/server/api/src/app/authentication/lib/access-token-manager.ts` — JWT generation (`generateToken`, `generateEngineToken`, `generateWorkerToken`) and `verifyPrincipal`
- `packages/server/api/src/app/authentication/lib/password-hasher.ts` — bcrypt helpers
- `packages/server/api/src/app/authentication/user-identity/user-identity-entity.ts` — `user_identity` table entity
- `packages/server/api/src/app/authentication/user-identity/user-identity-service.ts` — identity CRUD, password verification, `verify()`, `getIdentityByEmail()`
- `packages/core/shared/src/lib/core/authentication/dto/authentication-response.ts` — `AuthenticationResponse` Zod schema
- `packages/web/src/features/authentication/hooks/auth-hooks.ts` — React Query mutations: `useSignIn`, `useSignUp`, `useSendOtpEmail`, `useResetPassword`, `useVerifyEmail`
- `packages/web/src/features/authentication/components/sign-in-form.tsx` — sign-in form component
- `packages/web/src/features/authentication/components/sign-up-form.tsx` — sign-up form component
- `packages/web/src/features/authentication/components/third-party-logins.tsx` — OAuth provider buttons
- `packages/web/src/app/routes/auth-routes.tsx` — route declarations: /sign-in, /sign-up, /forget-password, /reset-password, /verify-email, /invitation

## Edition Availability
All editions (Community, Enterprise, Cloud). Email auth checks and domain-allow-listing guards are skipped on Community edition. OTP email verification is sent on Cloud; on Community and Enterprise the identity is automatically marked verified.

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **UserIdentity** — the email + hashed password + provider record; one per email address, shared across platforms
- **User** — the platform-specific record linking an identity to a platform and project role
- **Platform** — the tenant namespace; auto-created on first sign-up
- **tokenVersion** — a random string stored on `UserIdentity`; rotating it invalidates all existing JWTs
- **PrincipalType** — `USER`, `ENGINE`, `WORKER`, `SERVICE`, `UNKNOWN`

## Entity

### `user_identity` (`UserIdentityEntity`)
| Column | Type | Notes |
|---|---|---|
| id | string | ApId |
| email | string | unique |
| password | string | bcrypt hash |
| firstName | string | |
| lastName | string | |
| verified | boolean | false until OTP confirmed or auto-verified |
| provider | string | `UserIdentityProvider` enum value |
| tokenVersion | string (nullable) | rotated on password change / logout-all |
| trackEvents | boolean (nullable) | |
| newsLetter | boolean (nullable) | |
| imageUrl | string (nullable) | OAuth avatar URL |

## Endpoints

| Method | Path | Security | Description |
|---|---|---|---|
| POST | `/v1/authentication/sign-up` | public | Create identity + user + platform (or join existing platform via invitation) |
| POST | `/v1/authentication/sign-in` | public | Verify password, return JWT |
| POST | `/v1/authentication/switch-platform` | publicPlatform (USER) | Exchange current token for a token on a different platform |

All endpoints are rate-limited via `API_RATE_LIMIT_AUTHN_MAX` / `API_RATE_LIMIT_AUTHN_WINDOW` system props.

## Service Methods

### `authenticationService`
- `signUp(params)` — validates domain and invitation (when `platformId` is set), creates identity and user, on new platform creates a personal project and sends OTP or auto-verifies
- `signInWithPassword(params)` — verifies bcrypt hash, checks domain and email-auth settings, returns `AuthenticationResponse`
- `federatedAuthn(params)` — used by OAuth/SAML callbacks; creates or retrieves identity and user, then returns token
- `switchPlatform(params)` — finds an existing user record on the target platform and issues a new token

### `accessTokenManager`
- `generateToken(principal, expiresInSeconds?)` — signs a `Principal` as JWT; default 7 days
- `generateEngineToken({ jobId, projectId, platformId })` — long-lived token for flow engine
- `generateWorkerToken()` — long-lived token for worker processes
- `verifyPrincipal(token)` — decodes JWT, checks `tokenVersion` match and user active status

## Side Effects on First Sign-Up
1. `UserIdentity` created
2. `User` created with `PlatformRole.ADMIN`
3. `Platform` created (named `"<firstName>'s Platform"`)
4. Default `Project` created with `ProjectType.PERSONAL`
5. On Cloud: OTP email sent via `otpService`
6. On CE/EE: identity auto-verified
7. `ApFlagId.USER_CREATED` flag saved
8. Telemetry `SIGNED_UP` event fired
9. Newsletter subscription attempted (production + non-embedding platforms only)

## Side Effects on Sign-In
1. `ApplicationEventName.USER_SIGNED_IN` audit event recorded
2. Telemetry `SIGNED_IN` event fired (email/password sign-in only; SSO/federated not covered)
