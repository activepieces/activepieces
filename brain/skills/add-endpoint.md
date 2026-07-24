---
name: add-endpoint
description: Use when adding a new API endpoint, route, or HTTP handler in Activepieces. ALWAYS use for new Fastify controller endpoints.
---

# Add API Endpoint

Steps for a new Activepieces Fastify endpoint:

1. **Read the pattern**: `packages/server/api/src/app/tables/table/table.controller.ts` is the reference.
2. **Create/update controller** using `FastifyPluginAsyncZod`. Handler calls the service with `projectId` + `request.body`.
3. **Define route config AFTER the controller** (not inline) — object with `config.security` + `schema` (tags, body Zod schema from `@activepieces/shared`, response map).
4. **Security access** — pick one: `securityAccess.project(principals, permission, { type: ProjectResourceType.X })` (project-scoped) · `securityAccess.platformAdminOnly(principals)` · `securityAccess.publicPlatform(principals)` · `securityAccess.public()` (no auth). Every endpoint needs one.
5. **Create module + register in `app.ts`** — module adds `entitiesMustBeOwnedByCurrentProject` preSerialization hook and registers the controller with a `/v1/...` prefix.
6. **Add Permission** if new → `Permission` enum in `@activepieces/shared`.
7. **Verify**: `npm run lint-dev`.

HTTP rule: POST for all create/update, DELETE for deletes — never PUT/PATCH.

Full procedure in the repo: `.agents/skills/add-endpoint/SKILL.md`
