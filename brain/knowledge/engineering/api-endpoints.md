---
icon: 🔌
---

# API & Endpoints

The Activepieces REST API reference. Source: `docs/endpoints/` plus generated `openapi.json`.

## Basics
- **Auth** — API keys, generated in the Platform Dashboard (Platform/Enterprise editions; contact sales@activepieces.com). Pass as a Bearer token: `Authorization: Bearer {API_KEY}`.
- **Pagination** — seek pagination via `limit` and `cursor` query params. Responses are `{ data, next, previous }` where `next`/`previous` are cursors.

## Endpoint groups
Each group has a schema page plus CRUD operations:
- **Projects** — create, update, list, delete.
- **Users** — update, list, delete.
- **User Invitations** — upsert, list, delete.
- **Project Members** — list, delete.
- **Connections** — upsert, list, get, delete; **Global Connections** — upsert, update, list, delete.
- **Variables** — create, list, update, delete. Reveal and owners are hidden from the reference.
- **Flows** — create, update, get, list, delete; **Flow Runs** — get, list.
- **Sample Data** — get.
- **Pieces** — schema, install.
- **Project Releases** — create.
- **Git Sync** (git-repos) — configure.
- **Folders** — create, update, get, list, delete.
- **Templates** — create, delete, get, list.
- **Worker Machines** — queue metrics.
- **Embedding** — add allowed embed origins.

## Gotchas
- `docs/openapi.json` is a committed dump of `GET /api/v1/docs`, not generated in CI, and it drifts. Dump it from a **cloud** edition server: the EE modules (project members, git sync, releases, global connections) only register in the cloud and enterprise editions, so a CE dump deletes them. Merge only the paths you changed instead of replacing the file, or unreviewed internal routes get published.
- A route with `tags` and `SERVICE_KEY_SECURITY_OPENAPI` shows up in the reference as API-key callable. If its `securityAccess` excludes `PrincipalType.SERVICE`, set `hide: true` instead.
