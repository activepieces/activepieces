---
name: add-entity
description: "Use when creating a new database table, entity, or data model. ALWAYS use for any new TypeORM EntitySchema creation."
---

# Add Database Entity

Create entity for $ARGUMENTS.

## Steps

1. **Read the pattern**: Open `packages/server/api/src/app/tables/table/table.entity.ts` as reference.

2. **Create entity file** at `packages/server/api/src/app/{module}/{name}.entity.ts`:
   - Use `EntitySchema` (NOT decorators)
   - Include `...BaseColumnSchemaPart` (id, created, updated)
   - Use `ApIdSchema` for foreign key columns (`{ ...ApIdSchema, nullable: false }`)
   - Add `projectId` column + relation to project (CASCADE delete)
   - Add `foreignKeyConstraintName` on all join columns
   - Array columns: `{ type: String, array: true, nullable: false }`

3. **Register entity**: Import and add to `getEntities()` array in `packages/server/api/src/app/database/database-connection.ts`. This is REQUIRED — TypeORM does NOT auto-discover.

4. **Create migration**:
   - Read [playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration)
   - Name: `{Timestamp}{PascalCaseDescription}` (e.g., `AddMyFeature1774500000000`)
   - Import in `packages/server/api/src/app/database/postgres-connection.ts`
   - Add to `getMigrations()` array (chronological order)
   - PGlite: `CREATE INDEX` (not `CONCURRENTLY`). Set `transaction = false` for `CONCURRENTLY`.

5. **Create repository**: `const myRepo = repoFactory(MyEntity)` — call as `myRepo()` or `myRepo(entityManager)` for transactions.

6. **Verify**: `npm run lint-dev`
