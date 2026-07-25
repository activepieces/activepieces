---
icon: ✉️
---

# User Invitations

Lets platform owners (and project members with `WRITE_INVITATION`) invite users to a platform (granting a `PlatformRole`) or a specific project (granting a named `ProjectRole`). New invites are either auto-accepted or kept PENDING with an emailed JWT link the recipient clicks to accept without a login session. On acceptance, platform role or project membership is provisioned, then the invitation is deleted.

### Entity
`user_invitation`: platformId, type (`PLATFORM`/`PROJECT`), platformRole (nullable), email (lowercased/trimmed), projectId (nullable), status (`PENDING`/`ACCEPTED`), projectRoleId (nullable FK). Unique index on `(email, platformId, projectId)` prevents duplicates. CASCADE relations to project + project_role.

### How it works
- Endpoints under `/v1/user-invitations`: `POST /` (create/upsert, USER+SERVICE), `GET /` (list), `POST /accept` (**fully public** — JWT is the security), `DELETE /:id` (revoke).
- `create` upserts by `(email, platformId, projectId)`; if ACCEPTED → immediate `accept()`; if PENDING + SMTP configured → emails link, else returns link in response. `provisionUserInvitation` applies all ACCEPTED invites for an email (platform role update or ProjectMember upsert), deleting each after.
- Invitation link: JWT-signed URL (7-day default) to `<platform-domain>/invitation?token=...&email=...`.

### Gotchas
- **Auto-accept**: SERVICE-key callers always auto-accept; project invites for already-registered users also auto-accept (added immediately, no click).
- Project invitations require `projectMustBeTeamType` + `WRITE_INVITATION` + `projectRolesEnabled` plan flag; platform invitations require platform ownership.
- If SMTP unconfigured, the `link` field is included in the response for the caller to surface manually; if configured, `link` is omitted and email is sent. Auto-accept + SMTP sends a "project member added" notification instead.

### Key files
Entry point: `userInvitationsService`, defined in `user-invitation.service.ts` and called from the routes in `user-invitation.module.ts` (which exports `invitationModule`).

- `packages/server/api/src/app/user-invitations/` — the whole backend slice: module + routes, service lifecycle (create, accept, list, delete, provision), TypeORM entity
- `packages/core/shared/src/lib/management/invitations/index.ts` — `UserInvitation`, `InvitationType`, `InvitationStatus`, and the request contracts
- `packages/web/src/features/members/components/` — invite dialog, invitation card with revoke, accept flow for incoming links
- `packages/web/src/features/members/api/` — frontend API client
- `packages/web/src/features/members/hooks/` — TanStack Query hooks

Paths verified 2026-07-17.
