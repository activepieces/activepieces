# TypeORM entities and migrations are registered manually

TypeORM does not auto-discover entities here, so a new entity must be added to the `getEntities()` array in `database-connection.ts`, and its migration must be imported in `postgres-connection.ts` and added to `getMigrations()`. We register explicitly (rather than glob-scanning) because the same entity set is shared across editions and packaging boundaries where filesystem globbing is unreliable; skipping registration causes silent runtime failures, which is why `.claude/rules/entity-registration.md` makes it a hard rule.
