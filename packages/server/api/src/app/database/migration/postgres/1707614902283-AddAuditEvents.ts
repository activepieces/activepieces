import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class AddAuditEvents1707614902283 implements MigrationInterface {
    name = 'AddAuditEvents1707614902283'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            CREATE TABLE "audit_event" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "projectId" character varying,
                "action" character varying NOT NULL,
                "userEmail" character varying NOT NULL,
                "projectDisplayName" character varying,
                "data" jsonb NOT NULL,
                "ip" character varying,
                "userId" character varying NOT NULL,
                CONSTRAINT "PK_481efbe8b0a403efe3f47a6528f" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "audit_event_platform_id_project_id_user_id_idx" ON "audit_event" ("platformId", "projectId", "userId")
        `)
        await queryRunner.query(`
            ALTER TABLE "audit_event"
            ADD CONSTRAINT "FK_8188cdbf5c16c58d431efddd451" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "auditLogEnabled" boolean
        `)

        await queryRunner.query(`
            UPDATE "platform"
            SET "auditLogEnabled" = false
        `)

        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "auditLogEnabled" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "auditLogEnabled"
        `)

        await queryRunner.query(`
            ALTER TABLE "audit_event" DROP CONSTRAINT "FK_8188cdbf5c16c58d431efddd451"
        `)
        await queryRunner.query(`
            DROP INDEX "audit_event_platform_id_project_id_user_id_idx"
        `)
        await queryRunner.query(`
            DROP TABLE "audit_event"
        `)
    }
}
