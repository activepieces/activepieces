# server-api

## What this codebase does

Fastify REST API for [Activepieces](https://www.activepieces.com), an
open-source workflow automation platform ("open source Zapier"). Hosts the
control plane: auth, project/platform CRUD, flow definitions, runs, MCP, EE
billing. Multi-tenant model is `Platform → Project → User`. TypeORM + Postgres.

## Auth shape

- **Per-route policy** is declared via `securityAccess` (see
  `src/app/core/security/authorization/`): `platformAdminOnly([...])`,
  `projectMembersOnly([...])`, `public()`. Routes with no `securityAccess`
  config are a bug — flag them.
- **Tenant filter** is enforced post-serialization by
  `entitiesMustBeOwnedByCurrentProject` (`src/app/authentication/authorization.ts`).
- **JWT issuance**: `authentication-service.ts`. **OAuth2 (3rd-party)**:
  `src/app/ee/oauth-apps/` + `src/app/mcp/oauth/`.

## Threat model

The two highest-impact attacks are (1) **cross-tenant data leak** — a query
that forgets `WHERE projectId = …` returns another customer's flows, runs,
or connection secrets — and (2) **SSRF via user-controlled URL** —
webhook/template/OAuth endpoints can be coaxed into hitting cloud-metadata
or internal services. RCE is contained to the engine sandbox; this package
just orchestrates it.

## Project-specific patterns to flag

- **Missing tenant filter.** Every TypeORM `find`/`findOne`/`update`/`delete`
  and every `createQueryBuilder` MUST include `projectId` or `platformId` in
  `where`, unless the route has `securityAccess.platformAdminOnly`. The
  multi-project shape uses `ArrayContains([projectId])` on a `projectIds`
  array column.
- **Raw `fetch(…)` / `axios.create(…)`.** Outbound HTTP MUST go through
  `safeHttp.axios` / `safeHttp.createAxios` from `@activepieces/server-utils`
  (wraps `request-filtering-agent` to block private/loopback/metadata IPs).
  Raw `fetch` / `axios` for any URL sourced from user input, admin config,
  OAuth endpoints, or third-party integrations is a real bug.
- **CE importing from `src/app/ee/`.** The community edition must not depend
  on EE code; EE extends CE via `hooksFactory.create(ceDefault).set(eeImpl)`
  in `app.ts`. Any `import … from "…/ee/…"` outside `src/app/ee/` itself is
  a violation.
- **Wrong HTTP verb.** Per project convention: `POST` for create/update,
  `DELETE` for delete. `PUT`/`PATCH` are bugs.
- **Unparameterized SQL.** TypeORM repos and `createQueryBuilder` are the
  norm. Any string-interpolated SQL or `query()` without `$N` placeholders
  is a finding.

## Known false-positives

- Endpoints declared with `securityAccess.platformAdminOnly([...])`
  legitimately span tenants (the admin-role middleware gates them) —
  e.g. `src/app/user/platform/platform-user-controller.ts`. Skipping the
  `projectId` filter is correct there.
- Endpoints declared with `securityAccess.public()` (OAuth token revoke,
  template metadata, health) are intentionally unauthenticated.
- Hardcoded outbound calls to trusted Activepieces endpoints
  (`api.activepieces.com`, `secrets.activepieces.com`) use `apAxios`, which
  is built on `safeHttp` — safe even though the URL is a constant.
- `src/app/knowledge-base/knowledge-base.service.ts` uses `databaseConnection().query`
  with proper `$N` placeholders for pgvector similarity search — that
  shape is the safe baseline; copy it, don't flag it.
