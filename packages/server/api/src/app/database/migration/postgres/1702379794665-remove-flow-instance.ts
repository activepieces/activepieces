import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class RemoveFlowInstance1702379794665 implements MigrationInterface {
    name = 'RemoveFlowInstance1702379794665'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "status" character varying NOT NULL DEFAULT 'DISABLED'
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "schedule" jsonb
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "publishedVersionId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "UQ_f6608fe13b916017a8202f993cb" UNIQUE ("publishedVersionId")
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)

        await queryRunner.query(`
            UPDATE "flow"
            SET "status" = "flow_instance"."status",
                "schedule" = "flow_instance"."schedule",
                "publishedVersionId" = "flow_instance"."flowVersionId"
            FROM "flow_instance"
            WHERE "flow"."id" = "flow_instance"."flowId"
        `)

        await queryRunner.query(`
            ALTER TABLE "flow_instance"
            RENAME TO "DELETED_flow_instance"
        `)

        logger.info('RemoveFlowInstance1702379794665 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "DELETED_flow_instance"
            RENAME TO "flow_instance"
        `)

        await queryRunner.query(`
            UPDATE "flow_instance"
            SET "status" = "flow"."status",
                "schedule" = "flow"."schedule",
                "flowVersionId" = "flow"."publishedVersionId"
            FROM "flow"
            WHERE "flow_instance"."flowId" = "flow"."id"
        `)

        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_published_version"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "UQ_f6608fe13b916017a8202f993cb"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "publishedVersionId"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "schedule"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "status"
        `)

        logger.info('RemoveFlowInstance1702379794665 down')
    }
}
