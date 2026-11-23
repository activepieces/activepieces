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
- `tokenVersion` on UserIdentity: a new value ends every issued token. A password change sets a new random value. There is no server-side logout.
- Every request re-checks the user (`assertUserSession`): status ACTIVE + identity verified + tokenVersion match.

### Endpoints
Both controllers are registered in every edition; the web gates the Users page.
- `GET /v1/users/:id` (any user or API key of the same platform), `POST /v1/users/me` (profile picture only), `DELETE /v1/users/me/profile-picture`.
- `GET /v1/users` (list), `POST /v1/users/:id` (role, status, externalId), `DELETE /v1/users/:id` via `platform-user-controller.ts`.

### Gotchas
- **Deactivation takes effect on the next request.** Sign-in answers 403 `USER_IS_INACTIVE`, and an open session answers 403 `SESSION_EXPIRED`, because `assertUserSession` reads the user on each request. Reactivation runs `checkUsersExceededLimit` first, so it fails when the plan has no free seat.
- **The Users page has no search, filter or pagination.** One request lists up to 2,000 users (`limit: 2000`) plus the pending platform invitations, so a larger platform does not show every user.
- **Deleting a user also deletes its `UserIdentity`** on self-hosted (CE/EE), but only when no `User` row on any platform still references that identity. Skip that cleanup and the orphaned identity keeps the email claimed: re-inviting the same person dead-ends with `EXISTING_USER` / `INVITATION_ONLY_SIGN_UP` on sign-up and `INVALID_CREDENTIALS` on sign-in, and CE has no reset-password path to recover from it. `otp` rows cascade away with the identity.
- **Cloud takes the other branch.** `platform-user-controller.ts` routes Cloud to `removeFromPlatform`, which nulls `platformId` and keeps the identity, since the same person may belong to other platforms. Only the CE/EE `delete` path removes identities.
- **`userIdentityService.create` matches email globally**, ignoring platform, so any identity left behind with no `User` row blocks sign-up for that email on every platform. Installs that deleted users before this cleanup existed still carry those orphans; clearing them needs `DELETE FROM user_identity ui WHERE NOT EXISTS (SELECT 1 FROM "user" u WHERE u."identityId" = ui.id)`.
- **`getOrCreateWithProject` creates the user, their personal project and their default-project memberships in one transaction**, because an existing user is never "new" again: a failure after the user row is saved would leave them without their default projects forever. Personal-project post-create hooks run after commit. The default-project join is `userHooks.postCreate`, a no-op in CE and `userEnterpriseHooks` in EE/Cloud.
- **Managed-auth (embedding) users never join default projects.** `managed-authn-service.ts` creates them with `userService.create`, not `getOrCreateWithProject`, so `userHooks.postCreate` never runs. That's on purpose: an embedded user is the platform's own customer, scoped to the project in their token, and joining the platform's default projects would open internal or shared projects to them.
- **People invited as Admin or Operator don't join the default projects.** Only users created as Members join them. Most users are created as Members and promoted afterwards by `provisionUserInvitation`, so the EE `userHooks.postCreate` also skips the join when an accepted Admin or Operator platform invite exists (`getAcceptedAdminOrOperatorInviteRole`), unless the caller assigned the role. SCIM create assigns it: the `platformRole` the identity provider sends, else the accepted Admin or Operator invite's role, else Member. An explicit SCIM role always wins over an invite.
- **`userService.update` checks who is making the change only when the caller passes `actorId`.** The platform user endpoint passes the principal id (user or API key). With it, only the owner may change the owner, and nobody may change their own role or deactivate themselves. SCIM and invitation provisioning pass no actor, so the identity provider can still change anyone. A caller without an actor must guard the owner itself: `provisionUserInvitation` skips the role update when the invited user is the platform owner, so an invitation for the owner's email cannot demote them. The SCIM user service does the same on PUT/PATCH (role and status are stripped when the target is the owner) and rejects DELETE on the owner with 403 — otherwise any platform admin can mint a `/v1/api-keys` service token (SCIM's only auth is `platformAdminOnly([PrincipalType.SERVICE])`) and take over the owner through SCIM.
- **A SCIM-managed project used as a default loses members SCIM didn't add.** A full SCIM group sync replaces that project's members with the identity provider's list, which removes the Editors who joined it as a default.

### Key files
Entry point: `userService`, a log-scoped factory in `user/user-service.ts` that most callers across the API import directly.

- `packages/server/api/src/app/user/` — user service and the User/UserIdentity entities
- `packages/server/api/src/app/user/platform/` — list, update and delete endpoints, registered as `platformUserModule` in `app.ts`
- `packages/server/api/src/app/ee/users/` — the `/v1/users/:id` and `/v1/users/me` controller, registered as `userModule`
- `packages/core/shared/src/lib/core/user/` — User and UserWithMetaInformation schemas, PlatformRole and UserStatus enums
- `packages/web/src/app/routes/platform/users/` — platform admin user list page and table columns
- `packages/web/src/app/routes/platform/users/actions/` — row action menu, edit role/status dialog, toggle status, delete
- `packages/web/src/app/routes/platform/security/project-role/` — the Roles & Access page at `/platform/users/roles`
- `packages/tests-e2e/scenarios/ee/admin/` — `users-roles.spec.ts`, the E2E spec of this page and of custom project roles
- `packages/web/src/features/authentication/` — sign-in, sign-up, change-password forms and the auth React Query hooks

Paths verified 2026-11-22.
