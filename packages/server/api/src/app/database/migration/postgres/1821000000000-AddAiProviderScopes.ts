import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

// transaction = false because CREATE INDEX CONCURRENTLY is illegal inside a
// transaction block. The column adds are instant (defaults on modern Postgres)
// and each statement runs autocommit.
export class AddAiProviderScopes1821000000000 implements Migration {
    name = 'AddAiProviderScopes1821000000000'
    breaking = false
    release = '0.87.1'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ADD COLUMN IF NOT EXISTS "modelScope" character varying NOT NULL DEFAULT 'all',
            ADD COLUMN IF NOT EXISTS "modelIds" character varying array NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS "projectScope" character varying NOT NULL DEFAULT 'all',
            ADD COLUMN IF NOT EXISTS "projectIds" character varying array NOT NULL DEFAULT '{}'
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ALTER COLUMN "modelIds" DROP DEFAULT,
            ALTER COLUMN "projectIds" DROP DEFAULT
        `)
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_ai_provider_platform_id_provider"
                ON "ai_provider" ("platformId", "provider")
            `)
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_ai_provider_project_ids_gin"
                ON "ai_provider" USING GIN ("projectIds")
            `)
        }
        else {
            // CONCURRENTLY avoids a ShareLock that would block writes on the
            // existing "ai_provider" table for the duration of each build. A build
            // that dies part-way leaves an INVALID index behind, which IF NOT EXISTS
            // would happily skip on the next attempt, so drop that first.
            await createIndexConcurrently(queryRunner, {
                name: 'idx_ai_provider_platform_id_provider',
                ddl: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ai_provider_platform_id_provider"
                      ON "ai_provider" ("platformId", "provider")`,
            })
            await createIndexConcurrently(queryRunner, {
                name: 'idx_ai_provider_project_ids_gin',
                ddl: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ai_provider_project_ids_gin"
                      ON "ai_provider" USING GIN ("projectIds")`,
            })
        }
    }

    // No CONCURRENTLY here: TypeORM always wraps down() in a transaction, and
    // concurrent index builds/drops are illegal inside one.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_ai_provider_project_ids_gin"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            DROP COLUMN "modelScope",
            DROP COLUMN "modelIds",
            DROP COLUMN "projectScope",
            DROP COLUMN "projectIds"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider"
            ON "ai_provider" ("platformId", "provider")
        `)
    }
}

async function createIndexConcurrently(queryRunner: QueryRunner, { name, ddl }: { name: string, ddl: string }): Promise<void> {
    const invalid = await queryRunner.query(
        `SELECT 1 FROM pg_class c
         JOIN pg_index i ON i.indexrelid = c.oid
         WHERE c.relname = $1 AND NOT i.indisvalid`,
        [name],
    )
    if (invalid.length > 0) {
        await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${name}"`)
    }
    await queryRunner.query(ddl)
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
