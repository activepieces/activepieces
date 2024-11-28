import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAuditLogIndicies1731711188507 implements MigrationInterface {
    name = 'AddAuditLogIndicies1731711188507'
    transaction = false
    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'up')
        await queryRunner.query(`
            DROP INDEX CONCURRENTLY IF EXISTS "audit_event_platform_id_project_id_user_id_idx"
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_event_platform_id_project_id_user_id_action_idx" ON "audit_event" ("platformId", "projectId", "userId", "action")
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_event_platform_id_user_id_action_idx" ON "audit_event" ("platformId", "userId", "action")
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_event_platform_id_action_idx" ON "audit_event" ("platformId", "action")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'down')
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

}
