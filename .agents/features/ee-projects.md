# EE Projects Module

## Summary
The EE Projects module adds team collaboration, role-based access control (RBAC), git-based environment sync, and per-project piece filtering on top of the base project entity. It introduces project membership (invitations, roles), custom project roles with fine-grained permissions, project releases for deploying flows between environments, and a git sync mechanism for version-controlling flow definitions in an external repository.

## Key Files
- `packages/server/api/src/app/ee/projects/` — platform project service, RBAC enforcement
- `packages/server/api/src/app/ee/project-members/` — member CRUD, role lookup
- `packages/server/api/src/app/ee/project-role/` — default and custom role management
- `packages/server/api/src/app/ee/project-release/` — release creation, diff, apply
- `packages/server/api/src/app/ee/git-sync/` — SSH repo push/pull
- `packages/shared/src/lib/ee/project-members/project-member.ts` — `ProjectMember` type
- `packages/shared/src/lib/ee/project-members/project-member-request.ts` — list/update request DTOs
- `packages/shared/src/lib/automation/project-release/project-release.ts` — `ProjectRelease` type
- `packages/shared/src/lib/automation/project-release/project-release.request.ts` — release request DTOs
- `packages/shared/src/lib/automation/project-release/project-state.ts` — `ProjectSyncPlan`
- `packages/web/src/features/members/api/project-members-api.ts` — `projectMembersApi`
- `packages/web/src/features/members/hooks/project-members-hooks.ts` — `projectMembersHooks`
- `packages/web/src/features/members/hooks/user-invitations-hooks.ts` — `userInvitationsHooks`
- `packages/web/src/features/members/components/` — `InviteUserDialog`, `EditRoleDialog`, `ProjectMemberCard`, `InvitationCard`
- `packages/web/src/features/project-releases/api/project-release-api.ts` — `projectReleaseApi`
- `packages/web/src/features/project-releases/api/git-sync-api.ts` — `gitSyncApi`
- `packages/web/src/features/project-releases/hooks/project-release-hooks.ts` — `projectReleaseQueries`
- `packages/web/src/features/project-releases/hooks/git-sync-hooks.ts` — `gitSyncHooks`
- `packages/web/src/app/components/project-settings/members/index.tsx` — `MembersSettings` component
- `packages/web/src/app/routes/project-release/index.tsx` — `ProjectReleasesPage`

## Edition Availability
- **Community (CE)**: Single-user projects only. No project members, no roles, no releases, no git sync.
- **Enterprise (EE, self-hosted)**: Full feature set behind `projectRolesEnabled` and `environmentsEnabled` plan flags.
- **Cloud**: Members and invitations available on paid plans. Custom roles behind `customRolesEnabled`. Git sync and releases behind `environmentsEnabled`.

## Domain Terms
- **ProjectMember**: A user's membership in a project, carrying a role assignment.
- **ProjectRole**: Named permission set (ADMIN/EDITOR/VIEWER built-in, or custom). Scoped to a platform.
- **Permission**: One of 26 granular capabilities (e.g. `READ_FLOW`, `WRITE_CONNECTION`).
- **ProjectRelease**: A snapshot of a project's flow/table/connection state, applied atomically. Supports rollback.
- **ProjectSyncPlan**: A diff object showing what would change (added/updated/deleted) before applying a release.
- **Git Sync**: Configuration of an SSH-backed git repo + branch used as a release source or push target.
- **RBAC**: Role-Based Access Control — enforced per-request via `rbacService.assertPrincipalAccessToProject()`.
- **Release Type**: GIT_BRANCH (from git), MANUAL (from another project), ROLLBACK (revert to a previous release).

## Project Members

**Entity**: id, projectId, userId, projectRoleId, platformId. Unique on (projectId, userId, platformId).

**Service methods**:
- `upsert({ userId, projectId, projectRoleName })` — create/update member with role lookup
- `list({ platformId, projectId?, projectRoleId? })` — paginated with user details
- `getRole({ userId, projectId })` — returns role (ADMIN if owner/platform admin)
- `update({ id, projectId, platformId, role })` — change member's role
- `delete(projectId, memberId)` — remove from project
- `getIdsOfProjects({ userId, platformId })` — all project IDs user belongs to

**Frontend**: `projectMembersApi.list/update/delete` backed by `projectMembersHooks.useProjectMembers()`. `MembersSettings` component shows combined table of active members, platform admins/operators, and pending invitations.

## Project Roles

**Entity**: id, name, permissions[] (string array), platformId (nullable), type (DEFAULT/CUSTOM).

**Default roles** (type=DEFAULT, platformId=null):
- **ADMIN**: All 26 permissions
- **EDITOR**: Read connections/flows/runs/tables, write flows/folders/tables, update flow status
- **VIEWER**: Read-only on connections, flows, runs, tables, folders

**Custom roles**: Platform-scoped, created by platform admins with any combination of 26 permissions.

## RBAC Enforcement

`rbacService.assertPrincipalAccessToProject()` routes by principal type:
- **USER**: Looks up ProjectMember → gets ProjectRole → checks permission
- **ENGINE**: Validates `principal.projectId === requestedProjectId`
- **SERVICE**: Validates `project.platformId === principal.platform.id`

## Project Releases (Git Sync)

**Entity**: id, projectId, name, description, importedBy (FK user), fileId (FK), type (GIT_BRANCH/MANUAL/ROLLBACK).

**Release workflow**:
1. `releasePlan()` — compute diff (what flows/tables/connections would change)
2. `create()` — apply diffs, serialize project state to File, record release
3. Uses memory lock to prevent concurrent releases

**Frontend**: `projectReleaseApi.diff()` previews changes before commit. `ApplyButton` triggers create. `ProjectReleasesPage` lists history with rollback action per row.

**Git sync** (`git-sync/`):
- Configure: SSH repo URL + branch + folder path
- Push: exports published flows/tables to git repo
- Pull: imports from git branch as release source
- Individual item push supported (specific flows/tables)

## Project Plan (Piece Filtering)

**Entity**: id, projectId (one-to-one), name, pieces[] (string array), piecesFilterType (NONE/ALLOWED), locked (boolean).

- `NONE`: All pieces available
- `ALLOWED`: Only pieces in `pieces[]` array visible
- Platform-level filtering (`FilteredPieceBehavior.ALLOWED/BLOCKED`) applied first, then project-level

## Platform Project Service

`platformProjectService.getForPlatform()` — lists projects with access control:
- Platform admins: see all projects
- Operators: see all projects except others' personal
- Regular users: see own personal + team projects where member
