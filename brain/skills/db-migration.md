---
name: db-migration
description: Use when adding a column, creating a table, adding an index, or making any TypeORM schema change to the Activepieces server database.
---

# Activepieces DB Migration

1. **Determine the change**: which tables, what SQL, whether it's breaking (drops/irreversible transforms), and the current release version (root `package.json` → `version`).
2. **Update the entity** file in `packages/server/api/src/app/` so the CLI can diff. Array columns: `{ type: String, array: true, nullable: false }`.
3. **Generate via CLI** from `packages/server/api/`: `npm run db-migration -- src/app/database/migration/postgres/MigrationName`. Never hand-write SQL.
4. **Patch the generated file**: swap `MigrationInterface` for `Migration` (`import { Migration } from '../../migration'`); add `breaking = false` (or true), `release = '<version>'`, and a correct `down()` reversing `up()`. CI fails without these three.
5. **Register** in `postgres-connection.ts`: import the class + add to the `getMigrations()` array (end, chronological). Won't run otherwise.
6. **Update types/service code** referencing the changed columns.

**PGlite**: no `CONCURRENTLY` support. Guard index create/drop with `isPGlite` (check `AppSystemProp.DB_TYPE === DatabaseType.PGLITE`), and set `transaction = false` whenever using `CONCURRENTLY`.

Prefer non-breaking migrations for safe rollback. Read the Database Migrations Playbook first.

Full procedure in the repo: `.agents/skills/db-migration/SKILL.md`
