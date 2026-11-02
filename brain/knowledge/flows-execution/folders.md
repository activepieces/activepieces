---
icon: 📁
---

# Folders

Folders are a lightweight organizational layer for flows within a project. Each folder has a display name (unique case-insensitively per project) and a display order; flows join a folder via their `folderId`.

### Entities & services
- **Folder** entity: id, displayName, projectId, displayOrder (default 0). Unique index `idx_folder_project_id_display_name` on `(projectId, displayName)`; many-to-one with project (CASCADE delete).
- **FolderDto** — folder plus `numberOfFlows` and `numberOfTables`, computed at query time via correlated subqueries.
- Service: `flowFolderService` in `folder.service.ts` (module + controller combined as one Fastify plugin).

### How it works
- Routes under `/v1/folders`, all requiring `projectId` resolvable via body/query/entity lookup:
  - `POST /` — create (upsert), `POST /:id` — rename, `GET /:id`, `GET /` — paginated list with counts, `DELETE /:id`.
- **Create is an upsert**: case-insensitive name match updates the existing folder instead of duplicating.
- Rename validates new-name uniqueness (allowing the folder to keep its own name).
- Audit events: `FOLDER_CREATED`, `FOLDER_UPDATED`, `FOLDER_DELETED` (fetched before delete so the event has full data).

### Gotchas
- **Folder names are unique case-insensitively, and `flowFolderService.upsert` returns a match as-is.** Upserting "order INTAKE" when "Order intake" exists returns the existing folder unchanged. It used to rename it to the request's casing. Chat create tools (`ap_create_flow`, `ap_build_flow`, `ap_create_table`) only file into an existing folder by name and never create one; `ap_create_folder` creates it, so a failed build leaves no folder behind.
- **`UncategorizedFolderId`** is the string literal `"NULL"` — a sentinel in the flow list query matching flows with no folder.
- **The `folderId` FK does not enforce the project boundary, and a foreign folder id makes the row vanish from the Automations page while it keeps running.** `fk_flow_folder_id` only requires the folder row to exist *somewhere*, so any write path that trusts a caller-supplied `folderId` can point a flow or table at another project's folder. The page renders exactly two buckets — flows whose `folderId` is in this project's folder list, and flows with `folderId IS NULL` — so a cross-project id matches neither: the flow disappears from the tree, from uncategorized, and from find-in-page, while staying ENABLED and burning task quota (GIT-1871, hit in production). Name search still finds it, because `flowService.list` has no folder restriction. Every write of a caller-supplied `folderId` must call `flowFolderService.getOneOrThrow({ projectId, folderId })` first, and must normalize the `UncategorizedFolderId` sentinel to `null` before the write — the literal `"NULL"` otherwise hits the FK and 500s. Client-side re-rooting cannot rescue an orphan: the root query asks the server for `folderId IS NULL`, so the orphan is never fetched.
- **Deleting a folder does NOT delete its flows** — they become uncategorized (the flow's `folderId` FK is nullable; not nulled automatically by the service).
- `displayOrder` is client-managed, not maintained by the backend.
- List is ordered ASC; counts come from correlated subqueries per row.

### Editions
Fully available in CE/EE/Cloud — no plan flag required.

### Key files
Entry point: `flowFolderService`, exported from `folder.service.ts` and wired up by the folder Fastify plugin.

- `packages/server/api/src/app/flows/folder/` — backend slice: module/controller, service, TypeORM entity
- `packages/core/execution/src/lib/flows/folders/` — shared types: `Folder`, `FolderDto`, `UncategorizedFolderId`, request and list-response schemas
- `packages/web/src/features/folders/` — frontend: API client, TanStack Query hooks, rename dialog

Paths verified 2026-07-17. An earlier version pointed at `packages/core/shared/src/lib/automation/flows/folders/`; those shared types now live in `packages/core/execution/src/lib/flows/folders/`.
