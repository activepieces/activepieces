# SCIM 2.0 Provisioning

## Summary
SCIM (System for Cross-domain Identity Management) 2.0 integration allows enterprise Identity Providers (IdPs) such as Okta, Azure AD, and Google Workspace to automatically provision, update, and deprovision users and groups in Activepieces. Users map directly to Activepieces platform users; Groups map to Activepieces projects (only `ProjectType.TEAM` projects). Authentication uses an API key passed as a Bearer token (`platformAdminOnly SERVICE` principal). The module also exposes the SCIM discovery endpoints (`ServiceProviderConfig`, `ResourceTypes`, `Schemas`) for IdP auto-configuration. Gated by `platform.plan.scimEnabled`.

## Key Files
- `packages/server/api/src/app/ee/scim/scim-module.ts` — module registration, `scimEnabled` guard, `application/scim+json` content type parser
- `packages/server/api/src/app/ee/scim/scim-user-controller.ts` — user CRUD endpoints
- `packages/server/api/src/app/ee/scim/scim-user-service.ts` — user provisioning logic
- `packages/server/api/src/app/ee/scim/scim-group-controller.ts` — group CRUD endpoints
- `packages/server/api/src/app/ee/scim/scim-group-service.ts` — group/project management logic
- `packages/server/api/src/app/ee/scim/scim-discovery-controller.ts` — discovery endpoints (ServiceProviderConfig, ResourceTypes, Schemas)
- `packages/shared/src/lib/ee/scim/index.ts` — all SCIM types, schemas, constants, `parseScimFilter`, `ScimError`

## Edition Availability
Enterprise and Cloud. Gated by `platform.plan.scimEnabled`. Module hook: `platformMustHaveFeatureEnabled((platform) => platform.plan.scimEnabled)`.

## Domain Terms
- **SCIM User** → Activepieces `User` + `UserIdentity` on the platform.
- **SCIM Group** → Activepieces `Project` with `type = TEAM`.
- **externalId**: Vendor-side stable identifier for users and groups, stored on the Activepieces entity.
- **active**: Boolean SCIM field; maps to `UserStatus.ACTIVE` / `UserStatus.INACTIVE`.
- **SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA**: Custom extension schema `urn:ietf:params:scim:schemas:activepieces:1.0:CustomUserAttributes` — carries `platformRole` for assigning admin vs. member roles during provisioning.
- **SCIM_DEFAULT_PROJECT_ROLE**: System env var (`AppSystemProp.SCIM_DEFAULT_PROJECT_ROLE`) controlling the role assigned when adding a user to a group (project). Defaults to `EDITOR`.

## Content Type
The module registers an `application/scim+json` parser so IdPs that use this MIME type are handled correctly (most IdPs send SCIM+JSON, not plain JSON).

## Endpoints

All require `platformAdminOnly([SERVICE])` (API key auth). Prefix: `/v1/scim/v2`.

### Users (`/v1/scim/v2/Users`)

| Method | Path | Description |
|---|---|---|
| GET | `/Users` | List users with optional `filter` (supports `userName eq "..."`) |
| GET | `/Users/:id` | Get user by ID |
| POST | `/Users` | Create (provision) a user |
| PUT | `/Users/:id` | Replace (full update) a user |
| PATCH | `/Users/:id` | Partial update (supports `replace` operations on `active`, `externalId`) |
| DELETE | `/Users/:id` | Deactivate a user (sets status to INACTIVE) |

### Groups (`/v1/scim/v2/Groups`)

| Method | Path | Description |
|---|---|---|
| GET | `/Groups` | List groups (maps to TEAM projects) with optional `filter` (supports `displayName eq "..."`) |
| GET | `/Groups/:id` | Get group by ID |
| POST | `/Groups` | Create a group (creates a new TEAM project) |
| PUT | `/Groups/:id` | Replace group (updates displayName, replaces full member list) |
| PATCH | `/Groups/:id` | Partial update (add/remove members, rename) |
| DELETE | `/Groups/:id` | Delete group (marks project for deletion) |

### Discovery (`/v1/scim/v2`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/ServiceProviderConfig` | Platform admin (USER or SERVICE) | SCIM capability advertisement |
| GET | `/ResourceTypes` | Platform admin (USER or SERVICE) | Lists User and Group resource types |
| GET | `/Schemas` | Platform admin (USER or SERVICE) | Full schema definitions for User and Group |

## User Provisioning Logic

When creating a user via SCIM:
1. Checks for existing user by `externalId` (conflict if found).
2. Looks up or creates a `UserIdentity` by the normalized email. New identities use `UserIdentityProvider.SAML`.
3. Checks for existing user on the platform with that identity (conflict if found).
4. Creates or retrieves the user with `getOrCreateWithProject`.
5. Sets `status` and `platformRole` from request fields.
6. Sends a welcome email via `emailService.sendScimUserWelcome`.

DELETE maps to deactivation, not hard deletion: `status` is set to `INACTIVE`.

## Group / Project Mapping

SCIM Groups map to Activepieces projects with `type = TEAM`:
- Creating a group creates a new project with `displayName` and optional `externalId`.
- Adding members to a group upserts project membership with `SCIM_DEFAULT_PROJECT_ROLE`.
- Deleting a group calls `platformProjectService.markForDeletion`.
- Only `TEAM` type projects appear in SCIM group listings; personal projects are excluded.

## Supported SCIM Capabilities

| Capability | Supported |
|---|---|
| Patch | Yes |
| Bulk operations | No |
| Filter | Yes (max 100 results) |
| Password change | No |
| Sort | No |
| ETag | No |
| Authentication | OAuth Bearer Token (API key) |
