When creating a new TypeORM entity, you MUST do ALL of these:
1. Add to `getEntities()` array in `packages/server/api/src/app/database/database-connection.ts`
2. Create migration + import in `postgres-connection.ts` + add to `getMigrations()` array
TypeORM does NOT auto-discover entities. Skipping step 1 causes silent failures at runtime.
