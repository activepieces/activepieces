import { logger } from '@activepieces/server-shared'
import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAlertsEntityPostgres1716989780835 implements MigrationInterface {
    name = 'AddAlertsEntityPostgres1716989780835'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "alert" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "channel" character varying NOT NULL,
                "receiver" character varying NOT NULL
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "alertsEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET "alertsEnabled" = false
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "alertsEnabled" SET NOT NULL
        `)
        const projects = await queryRunner.query(`
            SELECT p."id" AS "projectId", u."email" AS "receiver"
            FROM "project" p
            INNER JOIN "user" u ON u."id" = p."ownerId"
        `)

        let countAlerts = 0;
        for (const project of projects) {
            const alertId = apId();
            await queryRunner.query(
                'INSERT INTO alert (id, created, updated, projectId, channel, receiver) VALUES ($1, NOW(), NOW(), $2, "EMAIL", $3)',
                [alertId, project.projectId, project.receiver],
            );
            countAlerts++;
        }

        logger.info(`CreateAlerts1680986182074 Migrated ${countAlerts} alerts`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "flowIssuesEnabled"
        `)
        await queryRunner.query(`
            DROP TABLE "alert"
        `)
    }

}
