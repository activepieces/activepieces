# Server Backend

Fastify 5 + TypeORM (PostgreSQL) + BullMQ (Redis) + `fastify-type-provider-zod`.

## Tech Stack

- **Framework**: Fastify 5
- **ORM**: TypeORM with PostgreSQL
- **Job Queues**: BullMQ
- **Cache/Redis**: ioredis
- **Observability**: evlog (structured wide events, OTLP log drain via AP_OTEL_ENABLED)
- **Language**: TypeScript (strict)

## Project Structure

- `src/app/` — Feature modules (flows, pieces, tables, authentication, webhooks, etc.)
- `src/app/ee/` — Enterprise features (SSO, SAML, SCIM, multi-tenancy)
- `src/app/database/` — Database migrations and connection setup (TypeORM)
- `src/app/helper/` — Shared server utilities

## Patterns

- **Reuse existing endpoints before adding new ones** — Before adding a new endpoint, scan the controller you're working in (and any sibling controllers that handle the same resource) for an existing route that already returns the data you need. Prefer re-using or extending an existing endpoint over introducing a new one. New endpoints duplicate validation, caching, security configuration, docs, and test surface — and parallel endpoints tend to drift (different filters, different cache policies, different response shapes) and cause bugs. Only add a new endpoint when no existing route satisfies the use case.
- **Controllers**: Use `FastifyPluginAsyncTypebox` pattern for route definitions with TypeBox schema validation
- **Module wrappers own the route prefix** — In `app.ts`, every feature is registered as `await app.register(<somethingModule>)` with no inline `prefix` option. The prefix lives inside the module file (e.g. `await app.register(myController, { prefix: '/v1/...' })` inside `my-feature.module.ts`). Never register a controller directly from `app.ts` with an inline prefix — create a thin `*.module.ts` wrapper instead so the route's identity stays collocated with its handlers.
- **HTTP methods**: Use `POST` for all create and update operations
- **Database migrations**: Generated and managed via TypeORM
- **Feature modules**: Each module typically has controller, service, and entity files
- **Array columns in TypeORM entities**: Always use this pattern:
  ```ts
  columnName: {
      type: String,
      array: true,
      nullable: false,
  }
  ```

## Email Templates

Email templates live in `src/assets/emails/`. When creating or modifying email templates, follow these rules:

- **F-pattern layout** — All content (logo, heading, body, notes, fallback link, footer) must be **left-aligned**. The CTA button is auto-width, left-aligned.
- **Design system consistency** — Use the same font scale as the web app: Inter font family, 32px/500 headings, 16px body, 14px closing, 11px muted text. Colors: `#0a0a0a` headings, `#2f2e2e` body, `#a3a3a3` muted.
- **White-label ready** — Use `{{fullLogoUrl}}`, `{{primaryColor}}`, `{{primaryColorLight}}`, and `{{platformName}}` Mustache variables. Never hardcode "Activepieces" or brand colors.
- **Card-on-background layout** — White card (`560px`, `border-radius: 12px`) on `{{primaryColorLight}}` tinted background.
- **CTA button** — Auto-width, left-aligned, `{{primaryColor}}` background, 16px/500 white text, `12px 18px` padding, `8px` border-radius.
- **Fallback link** — Below the CTA: "If the button doesn't work, click here." at 11px `#a3a3a3`, with `click here` underlined in `{{primaryColor}}`.
- **Bold sparingly in body** — Only bold dynamic names the user needs to identify quickly (project name, role, flow name). Never bold static text.
- **Outlook compatibility** — Include `<!--[if mso]>` font-family override block. Use table-based layout with inline styles only.
- **No external dependencies** — No `<link>` stylesheets, no tracking pixels, no external font CSS. The `@font-face` CDN URLs in `<style>` are acceptable as progressive enhancement.
- **Footer** — Use `{{> footer}}` Mustache partial. It renders the address only on Cloud edition.

## N+1 Query Prevention

- **Never fetch a collection then query each item individually in a loop.** Use JOINs, subqueries, or `IN` clauses to push filtering and enrichment into a single query.
- When checking a condition across related rows (e.g. "does any membership have permission X?"), JOIN the related table and filter in SQL rather than loading all rows and filtering in JS.
- For list endpoints that enrich entities with related data, prefer `leftJoinAndSelect` / `innerJoin` or batch queries with `IN (:...ids)` over per-item lookups inside `Promise.all` / `.map()`.

## Guidelines

- Read existing code before making changes to understand patterns
- Follow the existing controller/service pattern when adding new endpoints
- Write database migrations for schema changes, never modify entities directly without a migration . use db-migration skill
- Keep enterprise features isolated in `src/app/ee/`

## Structured Logging Field Schema (evlog)

All structured logging goes through evlog — `logger.{info,warn,error,debug}({ fields }, msg)` and `wideEvent.set/error/timed` from `@activepieces/server-utils`. The **field keys** (not message strings) are the queryable schema behind dashboards, alerts, and the OTLP drain. They MUST be consistent: **one concept = one path, everywhere.** Following [evlog's guidance](https://www.evlog.dev/learn/wide-events), fields are **grouped by entity** (which flattens to the dotted `entity.id` paths OpenTelemetry recommends), not flat prefixed keys.

**Rules:**

1. **Group fields by entity; the entity's own id is `id` inside its group — never a top-level `<entity>Id`, `runId`, or bare `id`.** A flow run is `flowRun: { id }` (flattens to `flowRun.id`), not `flowRunId`/`runId`/`id`. The group is the camelCase singular entity from the domain model. This is the rule that matters most: the codebase previously logged the same flow-run id as `runId`, `flowRunId`, *and* `id`, which broke every correlation query.
2. **An entity's attributes live beside `id` in the same group, merged into one object.** `{ jobId, jobType }` → `job: { id, type }`; `{ pieceName, pieceVersion }` → `piece: { name, version }`; `flowRun: { id, status, environment }`. Never bare `name`/`version`/`status`/`type` at the top level.
3. **Errors use `error`, not `err`.** `ap-logger.ts` normalizes `obj.err ?? obj.error` and emits the canonical `error` key. Descriptively-named error fields (`migrationError`, `pageError`) are fine and stay as-is.
4. **Units as a suffix on leaf keys:** durations end in `Ms` (`durationMs`, `timings.{op}Ms`), bytes `Bytes`, counts `Count`/plural.
5. **Do not nest, and never set, reserved / auto-populated keys:** `service`, `version`, `level`, `msg`, `timestamp`, `error`, `timings`, `requestId`, `traceId`, `method`, `path` (attached by `evlog-setup.ts` / `ap-logger.ts` / `wide-event.ts` and the evlog request middleware). `requestId` stays flat — do not fold it into a group.

**Canonical groups:** `flowRun: { id, status, environment }`, `flow: { id, version }`, `flowVersion: { id }`, `project: { id }`, `platform: { id }`, `user: { id }`, `job: { id, type }`, `piece: { name, version }`, `connection: { id }` (`AppConnection`), `sandbox: { id }`, `worker: { id }`, `webhook: { id, requestId, mode, flowFound, responseStatus }`, `conversation: { id }`, `waitpoint: { id }`, `step: { name }`, `trigger: { name }`, `migration: { name }`.

Only the metadata object of a logging call (`logger.*`, `log.child`, `createLogger`, `wideEvent.set`) is grouped. **Data-model / wire fields stay flat** — `JobData.runId`, DB query args (`findOneBy({ id })`), service-call arguments (`resumeFromWaitpoint({ flowRunId })`), DTOs, return objects, and client event payloads are NOT logs and keep their original keys.

## Release Version Detection (`apVersionUtil`)

`apVersionUtil.getCurrentRelease()` (in `@activepieces/server-utils`, `ap-version.ts`) reads the running release from `<process.cwd()>/package.json`. **It is `cwd`-relative, not module-relative** — `__dirname` was tried and does not work in the bundled output, so do not "fix" it that way. On any failure (missing file, bad JSON, missing/non-string `version`) it logs a `warn` and returns the sentinel `UNKNOWN_VERSION` (`'0.0.0'`).

**`UNKNOWN_VERSION` means "the read failed", NOT "this process is version 0.0.0".** Never treat it as a real release. The worker↔app dispatch gate (added in PR #13518) stops a version-skewed worker from silently corrupting runs during rolling deploys. Both ends route their comparison through **`apVersionUtil.versionsAreCompatible({ versionA, versionB })`**, which is **fail-closed**:
- `undefined` on either side (an old, pre-gate worker) → incompatible.
- `'0.0.0'` on either side (read failed) → incompatible — **including when both sides are `'0.0.0'`**.
- otherwise → compatible iff the two real versions are equal.

**Why both-`'0.0.0'` must fail closed (do not "relax" this back to an equality check):** "both failed to read" is not "both are the same release". A persistent packaging/cwd defect that spans releases makes *two different* builds both report `'0.0.0'`; an equality check (`'0.0.0' === '0.0.0'`) would pass and dispatch a skewed run — exactly the silent corruption the gate exists to prevent. The cost of failing closed is idling, which is loud, lossless, and surfaces immediately in staging/canary (zero workers run), strictly preferable to a silent skewed run — and aligned with PR #13518's own "idle-and-wait, never silently-wrong" principle. In a correct deployment `'0.0.0'` never occurs (npm ships `package.json`), so the steady-state cost is zero. The gate logs at **error** level (not warn) when the cause is `'0.0.0'`, because that state will NOT self-heal on deploy completion and needs operator action.

For any **new** comparison on the current release, reuse `versionsAreCompatible` rather than writing a raw `!==`/`===`, and keep the fallback warning intact — it is the only signal that a read failed (the read happens once and is cached for the process lifetime).

This behavior (the read fallback and the full `versionsAreCompatible` case table, incl. both-`'0.0.0'`) is pinned by `packages/server/utils/test/ap-version.test.ts`; update it if you change the sentinel, the read strategy, or the compatibility rule.
