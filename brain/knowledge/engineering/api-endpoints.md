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
- **Flows** — create, update, get, list, delete; **Flow Runs** — get, list.
- **Sample Data** — get.
- **Pieces** — schema, install.
- **Project Releases** — create.
- **Git Sync** (git-repos) — configure.
- **Folders** — create, update, get, list, delete.
- **Templates** — create, delete, get, list.
- **Worker Machines** — queue metrics.
- **Embedding** — add allowed embed origins.
