import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { isNotOneOfTheseEditions } from '../../database-common'

const log = system.globalLogger()
const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddAuditLogIndicies1731711188507 implements MigrationInterface {
    name = 'AddAuditLogIndicies1731711188507'
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
                DROP INDEX CONCURRENTLY IF EXISTS "audit_event_platform_id_project_id_user_id_idx"
            `)
        }
        else {
            await queryRunner.query(`
                DROP INDEX IF EXISTS "audit_event_platform_id_project_id_user_id_idx"
            `)
        }

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_event_platform_id_project_id_user_id_action_idx" ON "audit_event" ("platformId", "projectId", "userId", "action")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "audit_event_platform_id_project_id_user_id_action_idx" ON "audit_event" ("platformId", "projectId", "userId", "action")
            `)
        }

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_event_platform_id_user_id_action_idx" ON "audit_event" ("platformId", "userId", "action")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "audit_event_platform_id_user_id_action_idx" ON "audit_event" ("platformId", "userId", "action")
            `)
        }

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_event_platform_id_action_idx" ON "audit_event" ("platformId", "action")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "audit_event_platform_id_action_idx" ON "audit_event" ("platformId", "action")
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
                DROP INDEX CONCURRENTLY IF EXISTS "audit_event_platform_id_action_idx"
            `)
            await queryRunner.query(`
                DROP INDEX CONCURRENTLY IF EXISTS "audit_event_platform_id_user_id_action_idx"
            `)
            await queryRunner.query(`
                DROP INDEX CONCURRENTLY IF EXISTS "audit_event_platform_id_project_id_user_id_action_idx"
            `)
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_event_platform_id_project_id_user_id_idx" ON "audit_event" ("platformId", "projectId", "userId")
            `)
        }
        else {
            await queryRunner.query(`
                DROP INDEX IF EXISTS "audit_event_platform_id_action_idx"
            `)
            await queryRunner.query(`
                DROP INDEX IF EXISTS "audit_event_platform_id_user_id_action_idx"
            `)
            await queryRunner.query(`
                DROP INDEX IF EXISTS "audit_event_platform_id_project_id_user_id_action_idx"
            `)
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "audit_event_platform_id_project_id_user_id_idx" ON "audit_event" ("platformId", "projectId", "userId")
            `)
        }
    }

}