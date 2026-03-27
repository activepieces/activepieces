# EE Authentication Module

Enterprise SSO, MFA, and RBAC enforcement.

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
