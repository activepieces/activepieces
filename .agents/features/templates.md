# Flow Templates

## Summary
The Templates feature provides a library of reusable flow (and table) blueprints that users can browse, import, and build on. Templates are typed into three categories: OFFICIAL (curated by Activepieces, stored on Cloud or proxied from cloud.activepieces.com for self-hosted), CUSTOM (created by a platform owner to share within their platform), and SHARED (one-off sharing URLs, not listable). On Cloud, official templates are stored in the database with a null platformId. On Community/Enterprise self-hosted, official templates are fetched at request time from the Activepieces Cloud API (`https://cloud.activepieces.com/api/v1/templates`). Custom templates require the `manageTemplatesEnabled` plan flag. Before saving, flows inside a template are validated and piece names extracted into a searchable `pieces` array.

## Key Files
- `packages/server/api/src/app/template/template.controller.ts` — REST controller (CRUD + listing + categories)
- `packages/server/api/src/app/template/template.service.ts` — core CRUD, list filtering, flow validation
- `packages/server/api/src/app/template/template.entity.ts` — TypeORM entity
- `packages/server/api/src/app/template/template-validator.ts` — validates flows and extracts piece names
- `packages/server/api/src/app/template/community-templates.service.ts` — proxies official templates from cloud for non-cloud editions
- `packages/server/api/src/app/ee/template/platform-template.service.ts` — EE: creates/updates CUSTOM templates for a platform
- `packages/shared/src/lib/management/template/template.ts` — `Template`, `TemplateType`, `TemplateStatus`, `FlowVersionTemplate`, `TableTemplate`, `TemplateTag`
- `packages/shared/src/lib/management/template/template.requests.ts` — `CreateTemplateRequestBody`, `UpdateTemplateRequestBody`, `ListTemplatesRequestQuery`
- `packages/web/src/features/templates/api/templates-api.ts` — frontend API client
- `packages/web/src/features/templates/components/templates-browse-dialog.tsx` — browsing/searching dialog
- `packages/web/src/features/templates/components/use-template-dialog.tsx` — importing a template into a project
- `packages/web/src/features/templates/components/share-template.tsx` — sharing a custom template
- `packages/web/src/app/routes/templates/` — public-facing template gallery page

## Edition Availability
- **Community (CE)**: OFFICIAL templates proxied from cloud. CUSTOM templates require `manageTemplatesEnabled` plan flag (off by default in CE).
- **Enterprise (EE)**: OFFICIAL templates proxied from cloud. CUSTOM templates available when `manageTemplatesEnabled` is enabled on the platform plan.
- **Cloud**: OFFICIAL templates stored directly in DB. CUSTOM templates available when `manageTemplatesEnabled` is enabled.

## Domain Terms
- **TemplateType**: `OFFICIAL` (Activepieces-curated, platformId = null), `CUSTOM` (platform-owned, requires `manageTemplatesEnabled`), `SHARED` (ad-hoc share, not listable).
- **TemplateStatus**: `PUBLISHED` (visible in listing) or `ARCHIVED` (hidden).
- **FlowVersionTemplate**: A flow version stripped of runtime-only fields (id, flowId, state, etc.) for embedding in a template.
- **TableTemplate**: A table schema (fields, options) embedded in a template for table-related automation blueprints.
- **TemplateTag**: A tag with a `title`, hex `color`, and optional `icon`.
- **pieces**: Denormalized array of piece names extracted from all steps in the template flows; indexed for fast filtering.
- **categories**: Array of string category names; indexed for fast filtering.
- **communityTemplates**: Service that proxies GET requests to `https://cloud.activepieces.com/api/v1/templates` for official templates in non-cloud editions.

## Entity

**template**
| Column | Type | Notes |
|---|---|---|
| id | string | BaseColumnSchemaPart |
| created | timestamp | BaseColumnSchemaPart |
| updated | timestamp | BaseColumnSchemaPart |
| name | string | |
| summary | string | |
| description | string | |
| type | string | TemplateType enum |
| status | string | TemplateStatus enum |
| platformId | string (nullable) | null for OFFICIAL templates |
| flows | jsonb (nullable) | Array of FlowVersionTemplate |
| tables | jsonb (nullable) | Array of TableTemplate |
| tags | jsonb | Array of TemplateTag |
| blogUrl | string (nullable) | |
| metadata | jsonb (nullable) | |
| author | string | |
| categories | string[] | Postgres text array, indexed |
| pieces | string[] | Postgres text array, indexed |

Indices: `idx_template_pieces`, `idx_template_categories`, `idx_template_platform_id`
Relation: many-to-one with `platform` (CASCADE on delete)

## Endpoints

All routes are prefixed `/v1/templates`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/categories` | public | Returns list of category strings |
| GET | `/:id` | public | Get one template by ID |
| GET | `/` | unscoped (all principals) | List templates (official + custom merged) |
| POST | `/` | publicPlatform (USER, SERVICE) | Create a CUSTOM or SHARED template |
| POST | `/:id` | publicPlatform (USER, SERVICE) | Update a CUSTOM template |
| DELETE | `/:id` | publicPlatform (USER, SERVICE) | Delete a CUSTOM template |

Query params for list: `type`, `pieces[]`, `tags[]`, `search`, `category`.

## Service Methods

**templateService**
- `getOne({ id })` — returns null if not found
- `getOneOrThrow({ id })` — throws ENTITY_NOT_FOUND
- `create({ platformId, params })` — validates flows, extracts pieces. CUSTOM type delegates to `platformTemplateService`.
- `update({ id, params })` — re-validates flows if provided. CUSTOM type delegates to `platformTemplateService`.
- `list({ platformId, pieces, tags, search, type, category })` — queries with ArrayOverlap for pieces, ArrayContains for categories, ILIKE for search. Only returns PUBLISHED templates.
- `delete({ id })` — hard delete

**communityTemplates** (CE/EE only)
- `list(query)` — proxies to Cloud API with query string forwarding
- `getOrThrow(id)` — proxies single-template fetch to Cloud API
- `getCategories()` — proxies categories endpoint to Cloud API

## Business Logic Notes

- The list endpoint merges official and custom templates. Official comes from Cloud DB (on cloud edition) or the community proxy (self-hosted). Custom comes from the local DB filtered by `platformId`.
- Only platform owners (verified via `platformMustBeOwnedByCurrentUser`) can create, update, or delete CUSTOM templates.
- OFFICIAL and SHARED templates cannot be updated or deleted via the API.
- Template ownership is double-checked: `template.platformId === principal.platform.id`.
- Custom templates listing is skipped silently when `manageTemplatesEnabled` is false — no error is thrown, an empty array is returned.
- Flow version migration (`migrateFlowVersionTemplateList`) runs as a `preValidation` hook on create and update to handle schema evolution in stored flows.
