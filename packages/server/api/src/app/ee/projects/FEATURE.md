# EE Projects Module

Team collaboration, RBAC, git sync, and per-project configuration.

## Project Members

**Entity**: id, projectId, userId, projectRoleId, platformId. Unique on (projectId, userId, platformId).

**Service methods**:
- `upsert({ userId, projectId, projectRoleName })` — create/update member with role lookup
- `list({ platformId, projectId?, projectRoleId? })` — paginated with user details
- `getRole({ userId, projectId })` — returns role (ADMIN if owner/platform admin)
- `update({ id, projectId, platformId, role })` — change member's role
- `delete(projectId, memberId)` — remove from project
- `getIdsOfProjects({ userId, platformId })` — all project IDs user belongs to

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

**Entity**: id, projectId, name, description, importedBy (FK user), fileId (FK), type (GIT_BRANCH/MANUAL).

**Release workflow**:
1. `releasePlan()` — compute diff (what flows/tables/connections would change)
2. `create()` — apply diffs, serialize project state to File, record release
3. Uses memory lock to prevent concurrent releases

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
