---
icon: 👥
---

# Users

Manages user identity, platform membership, roles, and session security. A `User` ties a `UserIdentity` (canonical email/password/OAuth identity) to a specific platform, so the same person can exist across multiple platforms.

### Entities
- **User**: id, platformRole (ADMIN/MEMBER/OPERATOR), status (ACTIVE/INACTIVE), identityId (FK), externalId, platformId, lastActiveDate. Unique on `(platformId, identityId)`.
- **UserIdentity**: email, hashed password, firstName, lastName, provider (EMAIL/GOOGLE/SAML/JWT), verified, tokenVersion. One identity → many users across platforms.

### Platform roles
- **ADMIN**: full platform control, all projects visible.
- **MEMBER**: own projects + team projects where a member.
- **OPERATOR**: all projects except others' personal projects.

### Session management
- JWTs: 7-day for users, 100-year for engine/worker.
- `tokenVersion` on UserIdentity: incrementing invalidates all issued tokens. Logout increments it → all sessions invalidated.
- Validation checks: status ACTIVE + identity verified + tokenVersion match.

### Endpoints
- `GET /v1/users/me`, `POST /v1/users/me` (update firstName/lastName/profilePicture) — CE.
- Platform admin CRUD (list, update role/status, delete) via `platform-user-controller.ts` — EE/Cloud.

### Gotchas
- **Deleting a user also deletes its `UserIdentity`** on self-hosted (CE/EE), but only when no `User` row on any platform still references that identity. Skip that cleanup and the orphaned identity keeps the email claimed: re-inviting the same person dead-ends with `EXISTING_USER` / `INVITATION_ONLY_SIGN_UP` on sign-up and `INVALID_CREDENTIALS` on sign-in, and CE has no reset-password path to recover from it. `otp` rows cascade away with the identity.
- **Cloud takes the other branch.** `platform-user-controller.ts` routes Cloud to `removeFromPlatform`, which nulls `platformId` and keeps the identity, since the same person may belong to other platforms. Only the CE/EE `delete` path removes identities.
- **`userIdentityService.create` matches email globally**, ignoring platform, so any identity left behind with no `User` row blocks sign-up for that email on every platform. Installs that deleted users before this cleanup existed still carry those orphans; clearing them needs `DELETE FROM user_identity ui WHERE NOT EXISTS (SELECT 1 FROM "user" u WHERE u."identityId" = ui.id)`.
- **`getOrCreateWithProject` creates the user, their personal project and their default-project memberships in one transaction**, because an existing user is never "new" again: a failure after the user row is saved would leave them without their default projects forever. Personal-project post-create hooks run after commit. The default-project join is `userHooks.postCreate`, a no-op in CE and `userEnterpriseHooks` in EE/Cloud.
- **Managed-auth (embedding) users never join default projects.** `managed-authn-service.ts` creates them with `userService.create`, not `getOrCreateWithProject`, so `userHooks.postCreate` never runs. That's on purpose: an embedded user is the platform's own customer, scoped to the project in their token, and joining the platform's default projects would open internal or shared projects to them.
- **Admins and Operators join the default projects too.** Every new user is created as a Member first and promoted afterwards, so an Admin invite still adds Editor memberships to the default projects. They don't need them while they can reach every project, but they keep somewhere to land if they're later changed to Member.
- **A SCIM-managed project used as a default loses members SCIM didn't add.** A full SCIM group sync replaces that project's members with the identity provider's list, which removes the Editors who joined it as a default.

### Key files
Entry point: `userService`, a log-scoped factory in `user/user-service.ts` that most callers across the API import directly.

- `packages/server/api/src/app/user/` — user service and the User/UserIdentity entities
- `packages/server/api/src/app/user/platform/` — EE platform admin user endpoints, registered as `platformUserModule` in `app.ts`
- `packages/server/api/src/app/ee/users/` — the `/v1/users/me` controller and module
- `packages/core/shared/src/lib/core/user/` — User and UserWithMetaInformation schemas, PlatformRole and UserStatus enums
- `packages/web/src/app/routes/platform/users/` — platform admin user list page and table columns
- `packages/web/src/app/routes/platform/users/actions/` — row action menu, edit role/status dialog, toggle status, delete
- `packages/web/src/features/authentication/` — sign-in, sign-up, change-password forms and the auth React Query hooks

Paths verified 2026-07-17.
