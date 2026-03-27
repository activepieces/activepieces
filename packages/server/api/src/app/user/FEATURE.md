# User Module

User management, identity, badges, and platform roles.

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
- `POST /v1/users/me` — update profile (firstName, lastName)
- User CRUD managed via platform admin endpoints (EE)
