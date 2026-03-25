# Server Backend

You are working in the Activepieces server API (`packages/server/api`).

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

## Guidelines

- Read existing code before making changes to understand patterns
- Follow the existing controller/service pattern when adding new endpoints
- Write database migrations for schema changes, never modify entities directly without a migration
- Keep enterprise features isolated in `src/app/ee/`
