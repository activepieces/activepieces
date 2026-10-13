import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddAuditEventPlatformIdCreatedIdIndex1820000000000 implements Migration {
    name = 'AddAuditEventPlatformIdCreatedIdIndex1820000000000'
    breaking = false
    release = '0.86.4'
    // CONCURRENTLY (non-PGlite) is illegal inside a transaction.
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "audit_event_platform_id_created_id_desc_idx"
                ON "audit_event" ("platformId", "created" DESC, "id" DESC)
            `)
            return
        }
        // A killed CONCURRENTLY build leaves the index behind marked invalid, where
        // IF NOT EXISTS would skip the retry and report success on an index the planner
        // never uses.
        const invalid = await queryRunner.query(`
            SELECT 1 FROM pg_class c
            JOIN pg_index i ON i.indexrelid = c.oid
            WHERE c.relname = 'audit_event_platform_id_created_id_desc_idx' AND NOT i.indisvalid
        `)
        if (invalid.length > 0) {
            await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "audit_event_platform_id_created_id_desc_idx"')
        }
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_event_platform_id_created_id_desc_idx"
            ON "audit_event" ("platformId", "created" DESC, "id" DESC)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "audit_event_platform_id_created_id_desc_idx"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
