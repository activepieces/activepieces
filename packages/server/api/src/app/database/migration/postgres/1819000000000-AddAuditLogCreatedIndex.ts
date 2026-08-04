import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { isNotOneOfTheseEditions } from '../../database-common'
import { DatabaseType } from '../../database-type'

const log = system.globalLogger()
const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddAuditLogCreatedIndex1819000000000 implements MigrationInterface {
    name = 'AddAuditLogCreatedIndex1819000000000'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        log.info({
            name: this.name,
        }, 'up')
        const concurrent = !isPGlite

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_event_platform_id_created_idx" ON "audit_event" ("platformId", "created" DESC)
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "audit_event_platform_id_created_idx" ON "audit_event" ("platformId", "created" DESC)
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        log.info({
            name: this.name,
        }, 'down')
        const concurrent = !isPGlite

        if (concurrent) {
            await queryRunner.query(`
                DROP INDEX CONCURRENTLY IF EXISTS "audit_event_platform_id_created_idx"
            `)
        }
        else {
            await queryRunner.query(`
                DROP INDEX IF EXISTS "audit_event_platform_id_created_idx"
            `)
        }
    }
}
