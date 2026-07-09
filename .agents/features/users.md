# User Module

## Summary
Manages user identity, platform membership, roles, and session security. A `User` record ties a `UserIdentity` (the canonical email/password/OAuth identity) to a specific platform, enabling the same person to exist across multiple platforms. Platform roles gate what users can see and do.

## Key Files
- `packages/server/api/src/app/user/user-service.ts` — user CRUD, `getMe`, profile update, role assignment
- `packages/server/api/src/app/user/user-entity.ts` — User and UserIdentity entities
- `packages/server/api/src/app/user/platform/platform-user-controller.ts` — platform admin user management endpoints (EE)
- `packages/server/api/src/app/user/platform/platform-user-module.ts` — platform user module
- `packages/core/shared/src/lib/core/user/user.ts` — User, UserWithMetaInformation schemas; PlatformRole and UserStatus enums
- `packages/web/src/app/routes/platform/users/index.tsx` — platform admin user list page
- `packages/web/src/app/routes/platform/users/columns.tsx` — user table column definitions
- `packages/web/src/app/routes/platform/users/actions/user-actions.tsx` — action menu for a user row
- `packages/web/src/app/routes/platform/users/actions/update-user-dialog.tsx` — edit role/status dialog
- `packages/web/src/app/routes/platform/users/actions/edit-user-action.tsx` — edit action trigger
- `packages/web/src/app/routes/platform/users/actions/toggle-user-status-action.tsx` — activate/deactivate action
- `packages/web/src/app/routes/platform/users/actions/delete-user-action.tsx` — delete user action
- `packages/web/src/features/authentication/components/sign-in-form.tsx` — sign-in form
- `packages/web/src/features/authentication/components/sign-up-form.tsx` — sign-up form
- `packages/web/src/features/authentication/components/change-password.tsx` — password change form
- `packages/web/src/features/authentication/hooks/auth-hooks.ts` — auth React Query hooks

## Edition Availability
- Community (CE): User, UserIdentity, session management, `GET /v1/users/me`, `POST /v1/users/me`
- Enterprise (EE): Platform admin user CRUD via `platform-user-controller.ts` (list, update role, deactivate, delete). Non-owner admins may only modify users with MEMBER (or lower) role; the platform owner and peer admins are protected from modification by non-owner admins.
- Cloud: same as EE for multi-tenant platform management

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **User** — a platform-scoped membership record; one identity can have many users across platforms
- **UserIdentity** — the canonical credential record (email, hashed password, OAuth provider, verified flag, tokenVersion)
- **PlatformRole** — `ADMIN` (full control), `MEMBER` (own projects only), `OPERATOR` (read access to all projects)
- **tokenVersion** — integer on UserIdentity incremented on logout or password change; invalidates all issued JWTs

## Entities

**User**: id, platformRole (ADMIN/MEMBER/OPERATOR), status (ACTIVE/INACTIVE), identityId (FK to UserIdentity), externalId (nullable), platformId (FK), lastActiveDate. Unique on (platformId, identityId).

**UserIdentity**: id, email, password (hashed), firstName, lastName, provider (EMAIL/GOOGLE/SAML/JWT), verified (boolean), tokenVersion (for session invalidation). One identity → many users (across platforms).

## Platform Roles

- **ADMIN**: Full platform control, all projects visible
- **MEMBER**: Access to own projects + team projects where member
- **OPERATOR**: Access to all projects except others' personal projects

## Session Management

- JWT tokens: 7-day expiry for users, 100-year for engine/worker
- `tokenVersion` in UserIdentity: incrementing invalidates all existing tokens
- Session validation: checks user status (ACTIVE) + identity verified + tokenVersion match
- Logout: increments tokenVersion → all sessions invalidated

## Endpoints

- `GET /v1/users/me` — get current user with identity info
- `POST /v1/users/me` — update profile (firstName, lastName, profilePicture)
- User CRUD managed via platform admin endpoints (EE): list users, update role/status, delete user
