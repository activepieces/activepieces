# Folder Organization

## Summary
Folders provide a lightweight organizational layer for flows within a project. Each folder has a display name (unique case-insensitively per project) and a display order. Flows can be assigned to a folder via their `folderId` field. The folder list endpoint returns a `numberOfFlows` count alongside each folder, computed via a LEFT JOIN. A special sentinel value `NULL` (string `"NULL"`) represents uncategorized flows that have no folder. Creating or renaming a folder fires audit events. Folder names are enforced as unique per project (case-insensitive).

## Key Files
- `packages/server/api/src/app/flows/folder/folder.module.ts` — Fastify plugin (module + controller combined)
- `packages/server/api/src/app/flows/folder/folder.service.ts` — CRUD service (`flowFolderService`)
- `packages/server/api/src/app/flows/folder/folder.entity.ts` — TypeORM entity
- `packages/shared/src/lib/automation/flows/folders/folder.ts` — `Folder`, `FolderDto`, `FolderId`, `UncategorizedFolderId`
- `packages/shared/src/lib/automation/flows/folders/folder-requests.ts` — `CreateFolderRequest`, `UpdateFolderRequest`, `DeleteFolderRequest`, `ListFolderRequest`
- `packages/web/src/features/folders/components/rename-folder-dialog.tsx` — rename dialog
- `packages/web/src/features/folders/api/` — frontend API client
- `packages/web/src/features/folders/hooks/` — TanStack Query hooks

## Edition Availability
- **Community (CE)**: Fully available — no plan flag required.
- **Enterprise (EE)**: Fully available.
- **Cloud**: Fully available.

## Domain Terms
- **Folder**: Named group that flows belong to within a project. Display name is unique per project (case-insensitive).
- **FolderDto**: Folder plus `numberOfFlows: number` computed at query time.
- **displayOrder**: Numeric field for client-side ordering (default 0). Not managed by the backend directly; clients may send the value.
- **UncategorizedFolderId**: The string literal `"NULL"` used as a sentinel in the flow list query to filter flows with no folder assignment.
- **upsert**: The create operation is exposed as an upsert — if a folder with the same display name (case-insensitive) already exists, it is updated instead of duplicated.

## Entity

**folder**
| Column | Type | Notes |
|---|---|---|
| id | string | BaseColumnSchemaPart + ApIdSchema |
| created | timestamp | BaseColumnSchemaPart |
| updated | timestamp | BaseColumnSchemaPart |
| displayName | string | |
| projectId | string | ApIdSchema |
| displayOrder | number | Default 0 |

Unique index: `idx_folder_project_id_display_name` on `(projectId, displayName)`.
Relation: one-to-many with `flow` (inverseSide `folder`); many-to-one with `project` (CASCADE on delete, FK `fk_folder_project`).

## Endpoints

All routes are prefixed `/v1/folders`. All require `projectId` to be resolvable (via `ProjectResourceType.BODY` or `ProjectResourceType.QUERY`). All responses pass through `entitiesMustBeOwnedByCurrentProject` pre-serialization hook.

| Method | Path | Auth / Permission | Description |
|---|---|---|---|
| POST | `/` | project(USER, SERVICE, WRITE_FLOW, BODY) | Create (or upsert) a folder |
| POST | `/:id` | project(USER, SERVICE, WRITE_FLOW, TABLE) | Rename a folder |
| GET | `/:id` | project(USER, SERVICE, READ_FLOW, TABLE) | Get a folder by ID |
| GET | `/` | project(USER, SERVICE, READ_FLOW, QUERY) | List folders (paginated) with flow counts |
| DELETE | `/:id` | project(USER, SERVICE, WRITE_FLOW, TABLE) | Delete a folder |

## Service Methods

**flowFolderService**
- `upsert({ projectId, request })` — case-insensitive lookup by name; updates if exists, inserts if not. Returns `FolderDto` with `numberOfFlows: 0` for new folders.
- `update({ projectId, folderId, request })` — renames a folder. Validates uniqueness of new name (allowing the same folder to keep its name).
- `list({ projectId, cursorRequest, limit })` — paginated list ordered ASC, with LEFT JOIN on `flow` to count `numberOfFlows`.
- `getOneOrThrow({ projectId, folderId })` — throws ENTITY_NOT_FOUND if not found. Counts flows separately via `flowService.count`.
- `getOneByDisplayNameCaseInsensitive({ projectId, displayName })` — used for uniqueness checks.
- `delete({ projectId, folderId })` — hard delete. Flows in the folder become uncategorized (their `folderId` is not nulled automatically — this is a DB-level concern via the flow entity's nullable FK).

## Audit Events

- `FOLDER_CREATED` — emitted after successful create
- `FOLDER_UPDATED` — emitted after successful rename
- `FOLDER_DELETED` — emitted before delete (folder is fetched first so event has full data)

## Notes

- Deleting a folder does not delete the flows inside it; flows become uncategorized.
- The `projectId` in `CreateFolderRequest` is a body field — the security middleware reads it from there (`ProjectResourceType.BODY`) to enforce project access.
- For GET and DELETE by ID, the `ProjectResourceType.TABLE` type causes the security middleware to resolve project access by looking up the folder entity in the DB.
