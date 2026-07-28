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
