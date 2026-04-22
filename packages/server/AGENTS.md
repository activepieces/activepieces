# Server Backend

Fastify 5 + TypeORM (PostgreSQL) + BullMQ (Redis) + `fastify-type-provider-zod`.

## Tech Stack

- **Framework**: Fastify 5
- **ORM**: TypeORM with PostgreSQL
- **Job Queues**: BullMQ
- **Cache/Redis**: ioredis
- **Observability**: OpenTelemetry
- **Language**: TypeScript (strict)

## Project Structure

- `src/app/` — Feature modules (flows, pieces, tables, authentication, webhooks, etc.)
- `src/app/ee/` — Enterprise features (SSO, SAML, SCIM, multi-tenancy)
- `src/app/database/` — Database migrations and connection setup (TypeORM)
- `src/app/helper/` — Shared server utilities

## Patterns

- **Reuse existing endpoints before adding new ones** — Before adding a new endpoint, scan the controller you're working in (and any sibling controllers that handle the same resource) for an existing route that already returns the data you need. Prefer re-using or extending an existing endpoint over introducing a new one. New endpoints duplicate validation, caching, security configuration, docs, and test surface — and parallel endpoints tend to drift (different filters, different cache policies, different response shapes) and cause bugs. Only add a new endpoint when no existing route satisfies the use case.
- **Controllers**: Use `FastifyPluginAsyncTypebox` pattern for route definitions with TypeBox schema validation
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
- **TypeORM entity relations**: When an entity has relations (e.g. a foreign key to `platform`), create an extended schema type that adds the relation properties, then use that as the `EntitySchema` generic. Never pass the base shared type directly — TypeORM requires relation keys to exist on the type. See `ProjectEntity` for reference:
  ```ts
  type MyEntitySchema = MySharedType & {
      platform: Platform
  }
  export const MyEntity = new EntitySchema<MyEntitySchema>({ ... })
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
- Write database migrations for schema changes, never modify entities directly without a migration
- Keep enterprise features isolated in `src/app/ee/`
