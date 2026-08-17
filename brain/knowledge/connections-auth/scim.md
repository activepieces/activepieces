---
icon: 👤
---

# SCIM

SCIM 2.0 provisioning: lets enterprise IdPs (Okta, Azure AD, Google Workspace) automatically provision, update, and deprovision users and groups. SCIM Users map to AP platform users; SCIM Groups map to AP `TEAM` projects only. Auth is an API key as a Bearer token (`platformAdminOnly [SERVICE]`). Gated by `platform.plan.scimEnabled` (EE/Cloud).

### Mapping
- **SCIM User** → AP `User` + `UserIdentity` (new identities use `UserIdentityProvider.SAML`).
- **SCIM Group** → AP `Project` with `type = TEAM` (personal projects excluded from listings).
- `active` maps to `UserStatus.ACTIVE`/`INACTIVE`; `externalId` stored on the AP entity.
- Custom extension schema `...activepieces:1.0:CustomUserAttributes` carries `platformRole`.

### How it works
- Prefix `/v1/scim/v2`. Registers an `application/scim+json` content-type parser (most IdPs send SCIM+JSON).
- Users: GET/GET :id/POST/PUT/PATCH/DELETE under `/Users` (filter supports `userName eq "..."`, max 100 results).
- Groups: same verbs under `/Groups` (filter `displayName eq "..."`); create makes a new TEAM project, member add upserts membership with `SCIM_DEFAULT_PROJECT_ROLE` (env var, defaults EDITOR), delete calls `markForDeletion`.
- Discovery: `GET /ServiceProviderConfig`, `/ResourceTypes`, `/Schemas`.

### Gotchas
- **DELETE is deactivation, not hard deletion** — user `status` set to INACTIVE.
- User provisioning conflicts if an existing user matches by `externalId` or by identity on the platform.
- Supported: Patch, Filter (max 100). Not supported: Bulk, password change, Sort, ETag.
- Provisioning sends a welcome email via `emailService.sendScimUserWelcome`.

### Key files
Entry point: `scimModule`, registered twice in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/ee/scim/` — the whole server slice: module registration and `scimEnabled` guard, user/group/discovery controllers, user and group services
- `packages/core/shared/src/lib/ee/scim/index.ts` — all SCIM types, schemas, constants, `parseScimFilter`, `ScimError`
- `packages/server/api/test/integration/ee/scim/` — integration tests covering the endpoints
- `docs/admin-guide/guides/scim/` — customer-facing IdP setup docs

Paths verified 2026-07-17.
