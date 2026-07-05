import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class AddCreatedIndexToAuditEvent1804000000000 implements Migration {
    name = 'AddCreatedIndexToAuditEvent1804000000000'
    breaking = false
    release = '0.86.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite ? '' : 'CONCURRENTLY'
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "audit_event_created_idx"
            ON "audit_event" ("created")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "audit_event_created_idx"')
    }
}
