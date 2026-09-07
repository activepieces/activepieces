---
icon: 📋
---

# Templates

Templates are a library of reusable flow (and table) blueprints users can browse, import, and build on. Before saving, flows inside a template are validated and their piece names extracted into a searchable `pieces` array.

### Entities & services
- **Template** entity: name, summary, description, type, status, platformId (nullable), flows (jsonb `FlowVersionTemplate[]`), tables, tags, categories (indexed text[]), pieces (indexed text[]).
- **TemplateType**: `OFFICIAL` (AP-curated, platformId=null), `CUSTOM` (platform-owned, needs `manageTemplatesEnabled`), `SHARED` (ad-hoc share URL, not listable).
- **TemplateStatus**: `PUBLISHED` (visible) or `ARCHIVED` (hidden).
- Services: `template.service.ts` (CRUD + list), `template-validator.ts`, `community-templates.service.ts`, EE `platform-template.service.ts`.

### How it works
- Routes under `/v1/templates`: `GET /categories`, `GET /:id`, `GET /` (public list, official + custom merged), `POST /`, `POST /:id`, `DELETE /:id` (platform-owner only).
- **Official template storage differs by edition**: on Cloud they live in the DB with null platformId; on self-hosted (CE/EE) they're proxied at request time from `https://cloud.activepieces.com/api/v1/templates` via `communityTemplates`.
- List filtering: ArrayOverlap for `pieces`, ArrayContains for `categories`, ILIKE for `search`. Only PUBLISHED templates returned.
- `FlowVersionTemplate` is a flow version stripped of runtime-only fields (id, flowId, state) for embedding.

### Gotchas
- **Custom templates require the `manageTemplatesEnabled` plan flag** (off by default in CE). When disabled, custom listing is skipped silently — returns empty array, no error.
- OFFICIAL and SHARED templates cannot be updated or deleted via API; ownership is double-checked (`template.platformId === principal.platform.id`).
- Flow version migration (`migrateFlowVersionTemplateList`) runs as a `preValidation` hook on create/update to handle schema evolution in stored flows.
- `pieces` and `categories` are denormalized + indexed for fast filtering.

- **`POST /v1/templates-telemetry/event` serves two callers, and only one of them is the relay — do not gate it on edition or skip the gate.** It is `securityAccess.public()`, and the local browser posts to it directly for VIEW, INSTALL and EXPLORE_VIEW (`packages/web/src/features/templates/api/templates-telemetry-api.ts`, four call sites); a self-hosted instance *also* posts to Cloud's copy of the same route via `sendToCloud`. Those three event types travel **only** this path, so treating the route as "the relay hop, already consented upstream" silently un-gates them for every opted-out self-hoster. The controller therefore resolves `platformUtils.getPlatformIdForRequest` and the service gates on that platform's row when one resolves; a null platform means the genuine relay case (a Cloud request with no principal, whose `projectId`/`templateId` belong to the sending deployment's database) and is forwarded. ACTIVATE/DEACTIVATE come from `trigger-source-service` with a real `projectId` and are gated through the project. Also note `sendToCloud`/`sendToInternal` use raw `fetch`, not `safeHttp`/`apAxios` — pre-existing, and only sound because both URLs are hardcoded.

### Editions
CE/EE proxy official templates from cloud; custom needs `manageTemplatesEnabled`. Cloud stores official in DB directly; custom needs `manageTemplatesEnabled`.

### Key files
Entry point: `templateController`, registered in `template.module.ts` under the `/v1/templates` prefix.

- `packages/server/api/src/app/template/` — controller, module, service, entity, validator, and the community-templates cloud proxy
- `packages/server/api/src/app/ee/template/platform-template.service.ts` — EE only, creates and updates CUSTOM templates for a platform
- `packages/core/shared/src/lib/management/template/` — shared types and request schemas (`Template`, `TemplateType`, `TemplateStatus`, `FlowVersionTemplate`, `TableTemplate`, `TemplateTag`, the Create/Update/List request bodies)
- `packages/web/src/features/templates/api/` — frontend API client
- `packages/web/src/features/templates/components/` — browse dialog, use-template import dialog, share dialog, explore card
- `packages/web/src/features/templates/hooks/` — templates data hooks
- `packages/web/src/app/routes/templates/` — public-facing template gallery page

Paths verified 2026-07-17.
