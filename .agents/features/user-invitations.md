# User Invitations

## Summary
The User Invitations feature lets platform owners and project members with the `WRITE_INVITATION` permission invite users to join a platform or a specific project. An invitation is scoped to either a platform (granting a `PlatformRole`) or a project (granting a named `ProjectRole`). When created, an invitation is either immediately auto-accepted (for SERVICE key calls or when inviting an already-registered user to a project) or kept as PENDING and an email link is sent. The invitation link embeds a short-lived JWT token; recipients click it to accept without needing a login session. On acceptance, the user's platform role or project membership is provisioned automatically. Invitations are cleaned up after acceptance.

## Key Files
- `packages/server/api/src/app/user-invitations/user-invitation.module.ts` — Fastify plugin registration + all route handlers (acts as both module and controller)
- `packages/server/api/src/app/user-invitations/user-invitation.service.ts` — core invitation lifecycle: create, accept, list, delete, provision
- `packages/server/api/src/app/user-invitations/user-invitation.entity.ts` — TypeORM entity
- `packages/shared/src/lib/management/invitations/index.ts` — `UserInvitation`, `InvitationType`, `InvitationStatus`, `SendUserInvitationRequest`, `AcceptUserInvitationRequest`, `ListUserInvitationsRequest`
- `packages/web/src/features/members/components/invite-user/` — invite user dialog
- `packages/web/src/features/members/components/invitation-card.tsx` — displays a pending invitation with revoke action
- `packages/web/src/features/members/components/accept-invitation.tsx` — accept flow for incoming invitation links
- `packages/web/src/features/members/api/` — frontend API client for invitations
- `packages/web/src/features/members/hooks/` — TanStack Query hooks

## Edition Availability
- **Community (CE)**: Platform invitations available. Project invitations require `projectRolesEnabled` plan flag (gated via `projectMustBeTeamType` and `platformMustHaveFeatureEnabled`).
- **Enterprise (EE)**: Both platform and project invitations fully available when `projectRolesEnabled` is enabled.
- **Cloud**: Both platform and project invitations available; subject to plan `projectRolesEnabled` flag.

## Domain Terms
- **InvitationType**: `PLATFORM` (adds user to the platform with a PlatformRole) or `PROJECT` (adds user to a specific project with a ProjectRole).
- **InvitationStatus**: `PENDING` (email sent, awaiting click) or `ACCEPTED` (user provisioned).
- **PlatformRole**: Role granted at platform level (`ADMIN` or `MEMBER`).
- **ProjectRole**: Named role defined per-platform controlling project-level permissions (e.g. editor, viewer). Resolved by name at invite time.
- **Provision**: The act of actually applying an accepted invitation — updating the user's `platformRole` or creating a `ProjectMember` record.
- **Invitation link**: A JWT-signed URL (7-day expiry by default) pointing to `<platform-domain>/invitation?token=<jwt>&email=<email>`. If SMTP is configured, it is sent by email; otherwise the link is returned directly in the API response.
- **Auto-accept**: SERVICE key callers always get auto-accepted invitations. Project invitations for already-registered users are also auto-accepted (the user is added immediately without requiring a click).

## Entity

**user_invitation**
| Column | Type | Notes |
|---|---|---|
| id | string | BaseColumnSchemaPart |
| created | timestamp | BaseColumnSchemaPart |
| updated | timestamp | BaseColumnSchemaPart |
| platformId | string | Not null |
| type | string | InvitationType enum |
| platformRole | string (nullable) | Set for PLATFORM type |
| email | string | Lowercased and trimmed on save |
| projectId | string (nullable) | Set for PROJECT type |
| status | string | InvitationStatus enum |
| projectRoleId | string (nullable) | FK to project_role; set for PROJECT type |

Unique index: `idx_user_invitation_email_platform_project` on `(email, platformId, projectId)` — prevents duplicate pending invitations.
Relations: many-to-one with `project` (CASCADE on delete), many-to-one with `project_role` (CASCADE on delete).

## Endpoints

All routes are prefixed `/v1/user-invitations`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | publicPlatform (USER, SERVICE) | Create or upsert an invitation |
| GET | `/` | publicPlatform (USER, SERVICE) | List invitations (paginated) |
| POST | `/accept` | public | Accept an invitation via token |
| DELETE | `/:id` | unscoped (USER, SERVICE) | Revoke a pending invitation |

## Service Methods

**userInvitationsService**
- `create({ email, platformId, projectId, type, projectRoleId, platformRole, invitationExpirySeconds, status })` — upserts by `(email, platformId, projectId)`. If `status = ACCEPTED`, immediately calls `accept()`. If `status = PENDING` and SMTP is configured, sends an email with the link; otherwise returns the link in the response body.
- `accept({ invitationId, platformId })` — marks status ACCEPTED, resolves the user's identity by email, calls `provisionUserInvitation()` if the user already exists.
- `provisionUserInvitation({ user, email })` — finds all ACCEPTED invitations for the email, applies PLATFORM invitations by updating the user's platformRole, applies PROJECT invitations by upserting a `ProjectMember`. Deletes each invitation after applying.
- `list({ platformId, projectId, type, status, limit, cursor })` — paginated, always filtered by `platformId`.
- `delete({ id, platformId })` — hard delete, scoped to platform.
- `getOneByInvitationTokenOrThrow(token)` — decodes JWT, finds invitation by ID.
- `hasAnyAcceptedInvitations({ email, platformId })` — check whether a user has any accepted invitations (used during sign-up flow).
- `getByEmailAndPlatformIdOrThrow({ email, platformId, projectId })` — lookup for deduplication.

## Authorization Rules

- Creating a PROJECT invitation requires: `projectMustBeTeamType` (project is not a solo project) AND `WRITE_INVITATION` RBAC permission AND `projectRolesEnabled` platform plan flag.
- Creating a PLATFORM invitation requires: `platformMustBeOwnedByCurrentUser` (caller must be platform ADMIN).
- Deleting a PROJECT invitation requires `WRITE_INVITATION` permission on that project.
- Deleting a PLATFORM invitation requires platform ownership.
- Listing with a `projectId` filter also enforces `projectMustBeTeamType`.
- The `/accept` endpoint is fully public (no auth required) — security is provided by the JWT token.

## Email Behavior

- If SMTP is configured (`smtpEmailSender.isSmtpConfigured()`): invitation email is sent automatically; the `link` field is omitted from the API response.
- If SMTP is not configured: the `link` field is included in the `UserInvitationWithLink` response for the caller to surface manually.
- When an invitation is auto-accepted (SERVICE key or existing-user project invite) and SMTP is configured, a "project member added" notification email is sent instead.
