---
name: add-entity
description: Create a new TypeORM database entity in the Activepieces server. Use when adding a new table, entity, or data model (EntitySchema).
---

# Add Database Entity (Activepieces)

Full procedure in the repo: `.agents/skills/add-entity/SKILL.md`.

1. **Read the pattern**: `packages/server/api/src/app/tables/table/table.entity.ts`.
2. **Create entity** at `packages/server/api/src/app/{module}/{name}.entity.ts` — `EntitySchema` (NOT decorators), spread `...BaseColumnSchemaPart`, `ApIdSchema` for FK columns, add `projectId` column + CASCADE relation to project, `foreignKeyConstraintName` on join columns.
3. **Register** in `getEntities()` in `database/database-connection.ts` — REQUIRED, TypeORM does not auto-discover.
4. **Migration**: read the DB migration playbook; name `{Timestamp}{PascalCase}`; import in `postgres-connection.ts` + add to `getMigrations()` (chronological).
5. **Repository**: `const myRepo = repoFactory(MyEntity)`.
6. **Verify**: `npm run lint-dev`.
