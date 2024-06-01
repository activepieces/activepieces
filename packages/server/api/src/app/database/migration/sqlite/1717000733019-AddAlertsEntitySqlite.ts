import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'
import { apId } from '@activepieces/shared'

export class AddAlertsEntitySqlite1717000733019 implements MigrationInterface {
    name = 'AddAlertsEntitySqlite1717000733019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "alert" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "channel" varchar NOT NULL,
                "receiver" varchar NOT NULL
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

        let countAlerts = 0
        for (const project of projects) {
            const alertId = apId()
            await queryRunner.query(
                'INSERT INTO alert (id, created, updated, projectId, channel, receiver) VALUES (?, datetime(\'now\'), datetime(\'now\'), ?, "EMAIL", ?)',
                [alertId, project.projectId, project.receiver],
            )
            countAlerts++
        }

        logger.info(`CreateAlerts1680986182074 Migrated ${countAlerts} alerts`)
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
