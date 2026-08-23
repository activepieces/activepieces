---
icon: 🔐
---

# Connections & Auth

How Activepieces stores credentials and authenticates users, across CE/EE/Cloud. Multi-tenant rule throughout: connection queries filter by project via `ArrayContains([projectId])` on the `projectIds[]` array (never a scalar `projectId`), or by `scope = PLATFORM` for shared ones.

### App Connections

Encrypted credential records (AES-256) that flow steps use to call external services. Types: `OAUTH2`, `CLOUD_OAUTH2` (token exchange via secrets.activepieces.com), `PLATFORM_OAUTH2`, `SECRET_TEXT`, `BASIC_AUTH`, `CUSTOM_AUTH`, `NO_AUTH`, `OIDC`.

- **Entity/isolation**: `AppConnection` has `projectIds[]` (multi-project) + `scope` (PROJECT/PLATFORM). PROJECT connections queried with `ArrayContains([projectId])`; flows reference by stable `externalId` (survives rename).
- **OAuth refresh**: auto on retrieval; distributed Redis lock keyed `${platformId}_${externalId}` (project-invariant so shared connections serialize). Refresh_token/client_secret always stripped from API responses. CUSTOM_AUTH pieces can opt into refresh via a `refresh` callback (worker `EXECUTE_TOKEN_REFRESH` job).
- **OIDC**: AP acts as an OIDC IdP so pieces assume cloud roles (e.g. AWS AssumeRoleWithWebIdentity) without long-lived creds. Engine-only `POST /v1/worker/oidc-token` issues RS256 JWTs; public `/.well-known/openid-configuration` + `jwks.json`. Signing key auto-generated into the `flag` table (first-writer-wins, zero setup).
- **Gotcha**: `POST /replace` rewires flow refs between connections; PLATFORM source can't be deleted via replace (`403`); deleting a project source `409`s while a published flow still uses it. Deleting a connection does NOT cascade — flows fail at runtime.

### Global Connections (EE/Cloud)

App connections with `scope = PLATFORM`, shared across projects, managed from platform admin. Gated by `platform.plan.globalConnectionsEnabled`. Same `app_connection` table (the `scope` column distinguishes them); `projectIds[]` lists who can use it, `preSelectForNewProjects` auto-assigns new projects. All endpoints under `/v1/global-connections` require platform admin (USER or SERVICE key). Delegates to shared `appConnectionService` with `projectId: null`.

### OAuth Apps (EE)

Platform owners register their own OAuth client_id/secret per piece so connections use vendor-branded consent instead of AP's shared creds. Table `oauth_app`, unique `(platformId, pieceName)`, `clientSecret` encrypted (jsonb). No plan flag. List is readable by any platform member (dialog needs to know which pieces have custom creds); create/delete are admin-only. Secret only used server-side during token exchange.

### CE Authentication

User identity, sign-in, JWT sessions. `UserIdentity` = canonical email+password+provider (one per email, shared across platforms); `User` = platform-scoped membership. First sign-up auto-creates a Platform + personal Project + ADMIN user. JWT is 7-day, signed with a shared secret; rotating `tokenVersion` on UserIdentity invalidates all sessions. `accessTokenManager` also mints long-lived engine/worker tokens. Endpoints: `/v1/authentication/sign-up|sign-in|switch-platform`. PrincipalTypes: USER/ENGINE/WORKER/SERVICE/UNKNOWN/ONBOARDING (the last is the pre-platform session that can only call `POST /v1/platforms`).

### EE Authentication

Extends CE with SSO + RBAC. SAML 2.0 (`/v1/authn/saml/login` → IdP → ACS `/acs`) and Google/GitHub federated OAuth both funnel into `authenticationService.federatedAuthn()`; gated by `ssoEnabled`. Per-project RBAC via `assertPrincipalAccessToProject()` and `assertUserHasPermissionToFlow()`. Config stored on `platform.federatedAuthProviders`. Authz hooks: `platformMustHaveFeatureEnabled` (402), `projectMustBeTeamType`, `platformMustBeOwnedByCurrentUser`. OTP (email verify, password reset, and the `EMAIL_LOGIN` sign-in code) lives here. Its entity is registered for every edition, but `otpModule` is only registered on Cloud/EE and `sendOtp` returns early off those editions, so CE can send nothing today except `EMAIL_LOGIN`, which is gated on `SMTP_CONFIGURED` instead.

### Managed Auth / Embedding (EE)

Lets SaaS vendors embed the AP builder. Vendor backend signs a short-lived JWT with an RSA private key (Signing Key); SDK exchanges it at public `POST /v1/managed-authn/external-token`. AP verifies against stored public key (by `kid`), auto-provisions project + user + membership, returns a 7-day AP token. Managed user emails are deterministic SHA-256 of `managed_<platformId>_<externalUserId>` (never real emails). Token payload versions v2/v3/v4 (union ordered v4→v3→v2); v4 carries a `pieceSet` key. Gated by `embeddingEnabled` (via signing keys).

### API Keys (EE)

Platform-scoped `sk-` service credentials for machine-to-machine calls. 64 chars, stored only as SHA-256 hash (plaintext returned once on create); last 4 chars kept for display; `lastUsedAt` updated per request. Table `api_key`, admin-only under `/v1/api-keys`. Gated by `apiKeysEnabled`.

### User Invitations

Platform owners / members with `WRITE_INVITATION` invite users to a platform (grants PlatformRole) or a project (grants named ProjectRole). Invitation link = 7-day JWT to `/invitation?token=...`; sent by email if SMTP configured, else `link` returned in the API response. Auto-accept for SERVICE key callers and already-registered users invited to a project. On accept, `provisionUserInvitation` sets platformRole or upserts a ProjectMember, then deletes the invite. Project invites need `projectRolesEnabled` + team project.

### Users

`User` ties a `UserIdentity` to one platform (unique `(platformId, identityId)`). PlatformRole: ADMIN (all projects), MEMBER (own + team), OPERATOR (read all except others' personal). Session = user ACTIVE + identity verified + tokenVersion match; logout increments tokenVersion. `GET/POST /v1/users/me` (CE); platform admin user CRUD (list/role/status/delete) is EE.

### SCIM 2.0 (EE)

IdP-driven provisioning (Okta/Azure AD/Google). SCIM User → AP User+UserIdentity (provider SAML); SCIM Group → AP `TEAM` project. Auth = API key as Bearer (`platformAdminOnly SERVICE`); MIME `application/scim+json`. Endpoints under `/v1/scim/v2/Users|Groups` + discovery. DELETE user = deactivate (status INACTIVE), not hard delete. Group members added with `SCIM_DEFAULT_PROJECT_ROLE` (default EDITOR). Supports Patch + Filter (max 100); no bulk/sort/password. Gated by `scimEnabled`.

## Pages

- **App Connections** — the 7 auth types and stored credentials
- **Global Connections** — platform-shared connections
- **OAuth Apps** — custom per-piece client credentials
- **Managed Auth** — embedded token → AP session, auto-provisioning
- **Secret Managers** — external vaults (AWS, Vault, Conjur, 1Password)
- **CE Authentication** — UserIdentity, OTP, federated login
- **EE Authentication (SSO/RBAC)** — SAML 2.0, roles, enforcement
- **SCIM** — user provisioning (Okta, Microsoft Entra ID)
- **API Keys** — platform-scoped, hashed, `sk-` prefixed
