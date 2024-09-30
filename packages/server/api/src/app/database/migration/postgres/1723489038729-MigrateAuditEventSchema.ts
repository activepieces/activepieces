import { MigrationInterface, QueryRunner } from 'typeorm'

export class MigrateAuditEventSchema1723489038729 implements MigrationInterface {
    name = 'MigrateAuditEventSchema1723489038729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_project_id_user_id_idx"
        `)
        await queryRunner.query(`
            ALTER TABLE "audit_event"
            ALTER COLUMN "userEmail" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "audit_event"
            ALTER COLUMN "userId" DROP NOT NULL
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_project_id_user_id_idx" ON "audit_event" ("platformId", "projectId", "userId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_project_id_user_id_idx"
        `)
        await queryRunner.query(`
            ALTER TABLE "audit_event"
            ALTER COLUMN "userId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "audit_event"
            ALTER COLUMN "userEmail"
            SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_project_id_user_id_idx" ON "audit_event" ("platformId", "projectId", "userId")
        `)
    }

}
