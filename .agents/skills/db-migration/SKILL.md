---
name: db-migration
description: Creates TypeORM database migrations for the Activepieces server. Use when the user asks to add a column, create a table, add an index, or make any schema change to the database.
---

# Activepieces DB Migration

Create TypeORM database migrations for schema changes in the Activepieces server API.

## Workflow

### Step 1: DETERMINE THE CHANGE

Before generating, identify:
- Which table(s) are affected
- What SQL is needed (`ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX`, etc.)
- Whether the migration is **breaking** (drops columns/tables, transforms data irreversibly — cannot be rolled back safely)
- The current release version (check root `package.json` → `version`)

### Step 2: UPDATE THE ENTITY

Update the TypeORM entity file in `packages/server/api/src/app/` to reflect the new schema. This ensures the generation command can diff against the current state.

Array columns always use this pattern:
```ts
columnName: {
    type: String,
    array: true,
    nullable: false,
}
```

### Step 2: CREATE THE MIGRATION FILE

```ts
import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration' // ← must import from ../.. 

export class AddMyColumn1234567890 implements Migration {
    name = 'AddMyColumn1234567890'
    breaking = false 
    release = '0.78.0'   // ← match the upcoming release version from root package.json

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ADD COLUMN "description" text`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "description"`)
    }
}
```

**Required fields:**
- `breaking = false` — set to `true` only if rolling back is destructive
- `release = '<version>'` — the upcoming release version from root `package.json`
- `down()` — must reverse `up()` (required)

CI fails if any of these are missing.

### Step 3: REGISTER THE MIGRATION

Open `packages/server/api/src/app/database/postgres-connection.ts` and add the new migration class to the `getMigrations()` array (at the end, in chronological order):

```ts
import { AddMyColumn1234567890 } from './migration/postgres/1234567890-AddMyColumn'

// Inside getMigrations():
return [
    // ... existing migrations ...
    AddMyColumn1234567890,
]
```


## Note:
Always try to create non-breaking migrations if possible to allow safe rollbacks 

Zero errors required before the task is complete.

---

## PGlite Compatibility

PGlite does **not** support `CONCURRENTLY` (it is a single-connection embedded database). When creating or dropping indexes with `CONCURRENTLY`, add a PGlite check:

```ts
import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class AddMyIndex1234567890 implements Migration {
    name = 'AddMyIndex1234567890'
    breaking = false
    release = '0.78.0'
    transaction = false  // Required when using CONCURRENTLY

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query(`CREATE INDEX "idx_name" ON "table" ("column")`)
        } else {
            await queryRunner.query(`CREATE INDEX CONCURRENTLY "idx_name" ON "table" ("column")`)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query(`DROP INDEX "idx_name"`)
        } else {
            await queryRunner.query(`DROP INDEX CONCURRENTLY "idx_name"`)
        }
    }
}
```

Set `transaction = false` whenever using `CONCURRENTLY` — PostgreSQL requires it.

---

## Quick Reference

| Field | Value |
|---|---|
| Migration files | `packages/server/api/src/app/database/migration/postgres/` |
| Registration | `packages/server/api/src/app/database/postgres-connection.ts` |
| `Migration` import | `import { Migration } from '../../migration'` |


## Critical Reminders

1. **Never use `MigrationInterface`** — always use `Migration` from `../../migration`
2. **`breaking`, `release`, and `down()` are mandatory** — CI will reject the migration without them
3. **Register in `postgres-connection.ts`** — migration won't run without this
4. **PGlite + CONCURRENTLY** — always guard with `isPGlite` and set `transaction = false`
