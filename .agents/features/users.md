# User Module

## Summary
Manages user identity, platform membership, roles, session security, and a gamification badge system. A `User` record ties a `UserIdentity` (the canonical email/password/OAuth identity) to a specific platform, enabling the same person to exist across multiple platforms. Platform roles gate what users can see and do. The badge system awards achievement badges via application events and notifies users in real time via WebSocket.

## Key Files
- `packages/server/api/src/app/user/user-service.ts` — user CRUD, `getMe`, profile update, role assignment
- `packages/server/api/src/app/user/user-entity.ts` — User and UserIdentity entities
- `packages/server/api/src/app/user/badges/badge-service.ts` — badge award flow, event handling, email notification
- `packages/server/api/src/app/user/badges/badge-entity.ts` — UserBadge entity
- `packages/server/api/src/app/user/badges/badge-check.ts` — badge check interface
- `packages/server/api/src/app/user/badges/checks/active-flows-badges.ts` — FLOW_UPDATED badge checks
- `packages/server/api/src/app/user/badges/checks/flow-runs-badges.ts` — FLOW_RUN_FINISHED badge checks
- `packages/server/api/src/app/user/badges/checks/flow-content.ts` — flow content badge checks
- `packages/server/api/src/app/user/platform/platform-user-controller.ts` — platform admin user management endpoints (EE)
- `packages/server/api/src/app/user/platform/platform-user-module.ts` — platform user module
- `packages/shared/src/lib/core/user/user.ts` — User, UserWithMetaInformation, UserWithBadges schemas; PlatformRole and UserStatus enums
- `packages/shared/src/lib/core/user/badges/index.ts` — UserBadge schema
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
- Community (CE): User, UserIdentity, badges, session management, `GET /v1/users/me`, `POST /v1/users/me`
- Enterprise (EE): Platform admin user CRUD via `platform-user-controller.ts` (list, update role, deactivate, delete)
- Cloud: same as EE for multi-tenant platform management

## Domain Terms
- **User** — a platform-scoped membership record; one identity can have many users across platforms
- **UserIdentity** — the canonical credential record (email, hashed password, OAuth provider, verified flag, tokenVersion)
- **PlatformRole** — `ADMIN` (full control), `MEMBER` (own projects only), `OPERATOR` (read access to all projects)
- **tokenVersion** — integer on UserIdentity incremented on logout or password change; invalidates all issued JWTs
- **UserBadge** — an awarded achievement; keyed by badge name + userId; awarded at most once
- **Badge check** — an event-driven function that queries project/flow state and returns true if the badge should be awarded
- **BADGE_AWARDED** — WebSocket event emitted to the project room when a badge is awarded

## Entities

**User**: id, platformRole (ADMIN/MEMBER/OPERATOR), status (ACTIVE/INACTIVE), identityId (FK to UserIdentity), externalId (nullable), platformId (FK), lastActiveDate. Unique on (platformId, identityId).

**UserIdentity**: id, email, password (hashed), firstName, lastName, provider (EMAIL/GOOGLE/SAML/JWT), verified (boolean), tokenVersion (for session invalidation). One identity → many users (across platforms).

**UserBadge**: id, userId, name (badge key). Unique on (userId, name).

## Platform Roles

- **ADMIN**: Full platform control, all projects visible
- **MEMBER**: Access to own projects + team projects where member
- **OPERATOR**: Access to all projects except others' personal projects

## Badges System (9 badges)

**Check categories** (event-driven via ApplicationEvents):

1. **Active flows badges** — triggered by FLOW_UPDATED (LOCK_AND_PUBLISH / CHANGE_STATUS):
   - `first-build`: >=1 active flow
   - `on-a-roll`: >=5 active flows
   - `automation-addict`: >=10 active flows
   - `cant-stop`: >=50 active flows

2. **Flow run badges** — triggered by FLOW_RUN_FINISHED (production only):
   - `victory`: any SUCCEEDED run
   - `back-again`: any FAILED run (encourages retry)

3. **Flow content badges** — triggered by FLOW_UPDATED (LOCK_AND_PUBLISH):
   - `webhook-wizard`: flow contains webhook trigger
   - `agentic-genius`: flow contains AI piece
   - `coding-chad`: flow contains code step

**Award flow**: Event fires → `processBadgeChecks()` → evaluates checks → filters already-awarded → saves to DB → sends email → emits WebSocket `BADGE_AWARDED` event

## Session Management

- JWT tokens: 7-day expiry for users, 100-year for engine/worker
- `tokenVersion` in UserIdentity: incrementing invalidates all existing tokens
- Session validation: checks user status (ACTIVE) + identity verified + tokenVersion match
- Logout: increments tokenVersion → all sessions invalidated

## Endpoints

- `GET /v1/users/me` — get current user with identity info
- `POST /v1/users/me` — update profile (firstName, lastName, profilePicture)
- User CRUD managed via platform admin endpoints (EE): list users, update role/status, delete user
