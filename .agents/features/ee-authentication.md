# EE Authentication

## Summary
The Enterprise Authentication module extends the Community Edition auth layer with SAML 2.0 SSO, Google/GitHub federated OAuth, one-time-password email flows (verification and password reset), fine-grained RBAC enforcement per project, and a managed-auth JWT exchange for embedded SDK use cases. All SSO paths ultimately delegate to `authenticationService.federatedAuthn()` which creates or links a user and issues a standard AP JWT.

## Key Files
- `packages/server/api/src/app/ee/authentication/` — backend EE auth module root
- `packages/server/api/src/app/ee/authentication/saml-authn/` — SAML SSO service and controller
- `packages/server/api/src/app/ee/authentication/federated-authn/` — Google/GitHub OAuth service and controller
- `packages/server/api/src/app/ee/authentication/otp/` — OTP entity, service, and controller
- `packages/server/api/src/app/ee/authentication/enterprise-local-authn/` — email verify + password reset
- `packages/server/api/src/app/ee/authentication/project-role/` — RBAC enforcement service
- `packages/server/api/src/app/ee/authentication/ee-authorization.ts` — Fastify preHandler hooks for plan/ownership checks
- `packages/server/api/src/app/ee/managed-authn/` — managed auth JWT exchange controller + service
- `packages/shared/src/lib/ee/authn/index.ts` — enterprise authn shared exports
- `packages/shared/src/lib/ee/authn/access-control-list.ts` — ACL types for RBAC
- `packages/shared/src/lib/ee/authn/enterprise-local-authn/requests.ts` — verify email / reset password DTOs
- `packages/shared/src/lib/ee/otp/otp-model.ts` — OTP entity Zod schema and state enum
- `packages/shared/src/lib/ee/otp/otp-type.ts` — `OtpType` enum (`EMAIL_VERIFICATION`, `PASSWORD_RESET`)
- `packages/web/src/features/authentication/components/sign-in-form.tsx` — sign-in form (includes federated login buttons)
- `packages/web/src/features/authentication/components/third-party-logins.tsx` — Google/GitHub login buttons
- `packages/web/src/features/authentication/components/verify-email.tsx` — OTP email verification UI
- `packages/web/src/features/authentication/components/reset-password-form.tsx` — OTP-based password reset form
- `packages/web/src/features/authentication/hooks/auth-hooks.ts` — auth TanStack Query/mutation hooks
- `packages/web/src/features/authentication/api/managed-auth-api.ts` — managed auth API client
- `packages/web/src/app/routes/platform/security/sso/index.tsx` — SSO settings page (SAML + Google config)
- `packages/web/src/app/routes/platform/security/sso/saml-dialog.tsx` — SAML configuration dialog
- `packages/web/src/app/routes/platform/security/sso/oauth2-dialog.tsx` — Google/GitHub OAuth app dialog
- `packages/web/src/app/routes/platform/security/sso/allowed-domain.tsx` — allowed email domain dialog
- `packages/web/src/app/routes/authenticate/index.tsx` — SAML ACS callback landing page

## Edition Availability
- **Community (CE)**: OTP flows (email verification, password reset) and RBAC base types are available in CE. SSO, managed auth, and federated OAuth are EE/Cloud only.
- **Enterprise (EE)**: All features available; SAML and federated OAuth gated by `ssoEnabled` plan flag; managed auth gated by `embeddingEnabled`.
- **Cloud**: All features available; same plan flags apply.

## Domain Terms
- **SAML SSO**: Security Assertion Markup Language single sign-on; users authenticate at an external IdP (Okta, JumpCloud, etc.) and are redirected back with a signed assertion.
- **ACS (Assertion Consumer Service)**: The endpoint (`/v1/authn/saml/acs`) that receives and validates the IdP POST after SAML authentication.
- **Federated auth**: OAuth-based login via Google or GitHub; `POST /v1/authn/federated/login` initiates, `POST /v1/authn/federated/claim` completes.
- **OTP (One-Time Password)**: Short-lived code sent by email for email verification or password reset; 10-minute expiry, 10-minute resend prevention.
- **Managed auth**: JWT exchange mechanism for the embedding SDK — an external JWT signed with a platform signing key is exchanged for an AP JWT, auto-creating the user and project if needed.
- **RBAC**: Role-Based Access Control; enforced per-project by `assertPrincipalAccessToProject()` and per-flow-operation by `assertUserHasPermissionToFlow()`.
- **ssoEnabled**: Platform plan flag gating SAML and Google/GitHub federated auth.
- **embeddingEnabled**: Platform plan flag gating managed auth and signing keys.
- **federatedAuthProviders**: Field on the platform entity storing `{ saml: SAMLAuthnProviderConfig, google: GoogleOAuthConfig }`.

## SAML SSO (`saml-authn/`)

**Flow**:
1. `POST /v1/authn/saml/login` → generates SAML login request → returns `{ redirectUrl }` to IdP
2. User authenticates at Identity Provider (Okta, JumpCloud, etc.)
3. IdP POSTs SAML assertion to `POST /v1/authn/saml/acs`
4. `authnSsoSamlService.acs()` parses assertion, extracts email/firstName/lastName
5. Calls `authenticationService.federatedAuthn()` → creates/links user → returns JWT

**Config**: `SAMLAuthnProviderConfig { entityId, ssoUrl, certificate }` — stored in `platform.federatedAuthProviders.saml`

**Gating**: `platform.plan.ssoEnabled`

## Federated Auth — Google/GitHub (`federated-authn/`)

**Flow**:
1. `POST /v1/authn/federated/login` → returns Google/GitHub OAuth redirect URL
2. User authorizes on provider
3. Provider redirects with code to callback URL
4. `POST /v1/authn/federated/claim` → exchanges code for token → validates → creates/links user → returns JWT

**Config**: `platform.federatedAuthProviders.google { clientId, clientSecret }` or system-wide defaults

**Custom domain support**: Redirect URLs use custom domain if configured

## OTP — One-Time Passwords (`otp/`)

**Types**: `EMAIL_VERIFICATION`, `PASSWORD_RESET`

**Flow**:
1. `createAndSend()` → generates OTP → checks re-send prevention (10-min window) → sends email
2. `confirm()` → validates: pending state + not expired (10 min) + matches value → sets CONFIRMED

**Entity**: OTP with identityId, type, value, state (PENDING/CONFIRMED), updated timestamp

## Enterprise Local Auth (`enterprise-local-authn/`)

Extends CE auth with:
- `verifyEmail({ identityId, otp })` → confirms OTP → sets `UserIdentity.verified = true` → audit log
- `resetPassword({ identityId, otp, newPassword })` → confirms OTP → updates password hash → audit log

## RBAC Service (`project-role/`)

`assertPrincipalAccessToProject({ principal, permission, projectId })`:
- **USER**: `getPrincipalRoleOrThrow()` → `grantAccess({ principalRoleId, routePermission })` → throws PERMISSION_DENIED if no access
- **ENGINE**: `principal.projectId !== projectId` → throws
- **SERVICE**: `project.platformId !== principal.platform.id` → throws

`assertUserHasPermissionToFlow({ principal, operationType, projectId })`:
- Maps FlowOperationType to required Permission (e.g., CHANGE_STATUS → UPDATE_FLOW_STATUS)

## Authorization Hooks (`ee-authorization.ts`)

- `platformMustHaveFeatureEnabled(handler)` — throws FEATURE_DISABLED (402) if handler returns false
- `projectMustBeTeamType` — enforces project.type === TEAM
- `platformMustBeOwnedByCurrentUser` — enforces user is platform owner
- `platformToEditMustBeOwnedByCurrentUser` — enforces ownership for edit operations

## Managed Auth — Embedding (`managed-authn/`)

**Endpoint**: `POST /v1/managed-authn/external-token` (public — JWT provides security)

**Flow**:
1. Receives external JWT from embedded SDK
2. Decodes header → extracts `kid` (signing key ID)
3. Fetches signing key → verifies JWT signature with stored public key
4. Extracts: externalUserId, externalProjectId, firstName, lastName, role, piecesFilterType, piecesTags
5. Creates/gets Project (scoped to platform + externalProjectId)
6. Creates/gets User (scoped to platform + externalUserId, email = SHA256 hash)
7. Creates ProjectMember with role
8. Issues 7-day AP JWT token
9. Returns AuthenticationResponse (token + user/project data)

**JWT v3 payload**: `{ version: 'v3', externalUserId, externalProjectId, firstName, lastName, role, piecesFilterType, piecesTags, tasks, aiCredits, exp }`

## Frontend

The SSO settings page (`/platform/security/sso`) is wrapped in `LockedFeatureGuard` keyed on `platform.plan.ssoEnabled`. It surfaces three provider cards (Allowed Domains, Google, SAML 2.0) and an email auth toggle. `saml-dialog` captures `entityId`, `ssoUrl`, and `certificate`. `oauth2-dialog` captures `clientId` and `clientSecret` for Google. Email verification and password-reset flows in `verify-email` and `reset-password-form` POST OTPs to the enterprise local auth endpoints.
