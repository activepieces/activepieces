import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

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
                "receiver" character varying NOT NULL,
                PRIMARY KEY ("id")
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

        const countAlerts = await insertAlertsInBatches(projects, queryRunner)
        log.info(`CreateAlerts1716989780835 Migrated ${countAlerts} alerts`)
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

async function insertAlertsInBatches(projects: { projectId: string, receiver: string }[], queryRunner: QueryRunner, batchSize = 500): Promise<number> {
    if (projects.length === 0) return 0

    let totalInserted = 0

    for (let i = 0; i < projects.length; i += batchSize) {
        const batch = projects.slice(i, i + batchSize)
        const result = await insertBatch(batch, queryRunner)
        totalInserted += result
    }

    return totalInserted
}

async function insertBatch(batch: { projectId: string, receiver: string }[], queryRunner: QueryRunner): Promise<number> {
    let query = 'INSERT INTO "alert" ("id", "created", "updated", "projectId", "channel", "receiver") VALUES '
    const values = []
    const placeholders = []

    for (const project of batch) {
        const alertId = apId()
        placeholders.push(`($${values.length + 1}, NOW(), NOW(), $${values.length + 2}, 'EMAIL', $${values.length + 3})`)
        values.push(alertId, project.projectId, project.receiver)
    }

    query += placeholders.join(', ')

    await queryRunner.query(query, values)
    return batch.length 
}
