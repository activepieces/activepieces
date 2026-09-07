---
icon: ✉️
---

# User Invitations

Lets platform owners (and project members with `WRITE_INVITATION`) invite users to a platform (granting a `PlatformRole`) or a specific project (granting a named `ProjectRole`). New invites are either auto-accepted or kept PENDING with an emailed JWT link the recipient clicks to accept without a login session. On acceptance, platform role or project membership is provisioned, then the invitation is deleted. Pending invitations **reserve seats**: an invite that would add a new platform user consumes a seat at creation time, so `usedSeats` = active users + distinct reserved (non-expired) invites (decision 000014).

### Entity
`user_invitation`: platformId, type (`PLATFORM`/`PROJECT`), platformRole (nullable), email (lowercased/trimmed), projectId (nullable), status (`PENDING`/`ACCEPTED`), projectRoleId (nullable FK). Unique index on `(email, platformId, projectId)` prevents duplicates. CASCADE relations to project + project_role.

### How it works
- Endpoints under `/v1/user-invitations`: `POST /` (create/upsert, USER+SERVICE), `GET /` (list), `POST /accept` (**fully public** — JWT is the security), `DELETE /:id` (revoke).
- Create is split in two. When the invite would add a *new* platform user (`wouldAddNewUser`), `createInvitationRecord` (upsert by `(email, platformId, projectId)`) runs inside a transaction where `countAdditionalSeatsNeeded` feeds `checkUsersExceededLimit`, which takes a `pessimistic_write` lock on the platform's `platform_plan` row and counts reserved invites — the seat is reserved at invite creation, concurrent invites can't overshoot `usersLimit`, and an over-limit invite fast-fails with `QUOTA_EXCEEDED`. `finalizeInvitation` then runs after commit, outside the lock (SMTP/JWT work never holds it): if ACCEPTED → immediate `accept()`; if PENDING + SMTP configured → emails link, else returns link in response.
- `provisionUserInvitation` applies all ACCEPTED invites for an email (platform role update or ProjectMember upsert), deleting each after. It performs **no seat check** — accepting is seat-neutral (reserved invite −1, active user +1) and never blocks on `usersLimit`.
- Invitation link: JWT-signed URL (7-day default) to `<platform-domain>/invitation?token=...&email=...`.

### Gotchas
- **Auto-accept**: SERVICE-key callers always auto-accept; project invites for already-registered users also auto-accept (added immediately, no click).
- Project invitations require `projectMustBeTeamType` + `WRITE_INVITATION` + `projectRolesEnabled` plan flag; platform invitations require platform ownership.
- If SMTP unconfigured, the `link` field is included in the response for the caller to surface manually; if configured, `link` is omitted and email is sent. Auto-accept + SMTP sends a "project member added" notification instead.
- Seat enforcement only bites when billing is enforced for the platform (`isBillingEnforced`, OBSERVE otherwise) and is skipped in CE; the seat limit applied is `min(usersLimit, scheduledUsersLimit)`. Only invites whose email is not yet a platform member reserve a seat, and a repeat invite to the same reserved email needs no extra seat.
- **The "does this invite reserve a seat" rule has three implementations — change them together.** `countReservedInvites` (`platform-plan.service.ts`) expresses it as raw SQL (`status IN (PENDING, ACCEPTED)` + expiry cutoff + `NOT EXISTS` on an existing platform user); `wouldAddNewUser` re-checks the same membership condition in TypeScript; `countAdditionalSeatsNeeded` restates the same predicate in a third query builder. Editing one alone makes the counter and the guard disagree, which silently over- or under-counts seats.
- **Re-inviting a previously deleted user** works only because the CE/EE user delete also removes the now-orphaned `UserIdentity` (see [Users](./users.md)). The invitation itself always succeeds; when that cleanup has not run, the recipient's sign-up is what fails, with `EXISTING_USER`.
- **`POST /accept` answers with `registered`** — `true` when an identity already claims the invited email. The web accept page routes on exactly that field: falsy sends the recipient to `/sign-up`, `true` to `/sign-in`. The route has to spread it onto the invitation explicitly; while it was missing, every invitee landed on `/sign-up`, where an already-registered email dead-ends with `EXISTING_USER`.

### Key files
Entry point: `userInvitationsService`, defined in `user-invitation.service.ts` and called from the routes in `user-invitation.module.ts` (which exports `invitationModule`).

- `packages/server/api/src/app/user-invitations/` — the whole backend slice: module + routes, service lifecycle (create, accept, list, delete, provision), TypeORM entity
- `packages/core/shared/src/lib/management/invitations/index.ts` — `UserInvitation`, `InvitationType`, `InvitationStatus`, and the request contracts
- `packages/server/api/src/app/ee/platform/platform-plan/platform-plan.service.ts` — `checkUsersExceededLimit` + `countUsedSeats` (the seat-reservation counter)
- `packages/web/src/features/members/components/` — invite dialog, invitation card with revoke, accept flow for incoming links
- `packages/web/src/features/members/api/` — frontend API client
- `packages/web/src/features/members/hooks/` — TanStack Query hooks

Paths verified 2026-07-26.
