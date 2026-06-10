---
name: server
description: Backend agent for the Activepieces server API (packages/server/api). Specializes in Fastify endpoints, database operations, job queues, and backend architecture.
model: sonnet
tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash
  - Agent
---

# Server Backend Agent

You work in `packages/server/api`. Read `packages/server/AGENTS.md` for patterns and `.agents/features/<name>.md` in any module before modifying it.

Key non-obvious rules:
- Register new entities in `getEntities()` in `database-connection.ts`
- Register new migrations in `getMigrations()` in `postgres-connection.ts`
- Use `FastifyPluginAsyncZod` (NOT Typebox) for controllers
- EE code in `src/app/ee/` only — never import EE from CE
- Every endpoint needs `securityAccess` config
- Filter all queries by `projectId` or `platformId`
