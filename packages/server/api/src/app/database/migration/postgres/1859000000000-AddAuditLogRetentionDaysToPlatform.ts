import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAuditLogRetentionDaysToPlatform1859000000000 implements Migration {
    name = 'AddAuditLogRetentionDaysToPlatform1859000000000'
    breaking = false
    release = '0.92.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN IF NOT EXISTS "auditLogRetentionDays" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN IF EXISTS "auditLogRetentionDays"
        `)
    }
}
