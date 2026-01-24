import { MigrationInterface, QueryRunner } from 'typeorm'

export class AnalyticsAndOwnerToFlowId1767127482383 implements MigrationInterface {
    name = 'AnalyticsAndOwnerToFlowId1767127482383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            TRUNCATE TABLE "platform_analytics_report";
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "totalFlows"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "activeFlows"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "totalUsers"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "activeUsers"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "totalProjects"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "activeFlowsWithAI"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "topProjects"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "totalFlowRuns"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "ownerId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "users" jsonb NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)

        // For each flow, if the user in updatedBy does not belong to the flow's platform, set updatedBy (ownerId) to null
        await queryRunner.query(`
         UPDATE "flow_version" fv
            SET "updatedBy" = NULL
            FROM "flow" f
            JOIN "project" p ON p."id" = f."projectId",
                "user" u
            WHERE fv."flowId" = f."id"
            AND fv."updatedBy" IS NOT NULL
            AND u."id" = fv."updatedBy"
            AND (
                u."platformId" IS DISTINCT FROM p."platformId"
                OR u."platformId" IS NULL
            );

        `)
        // Backfill ownerId with the first flow version's updatedBy (earliest created) where updatedBy is not null
        await queryRunner.query(`
            UPDATE "flow" f
            SET "ownerId" = sub."updatedBy"
            FROM (
                SELECT DISTINCT ON ("flowId") "flowId", "updatedBy"
                FROM "flow_version"
                WHERE "updatedBy" IS NOT NULL
                ORDER BY "flowId", "created" ASC
            ) sub
            WHERE f."id" = sub."flowId"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_owner_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "users"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "ownerId"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "totalFlowRuns" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "topProjects" jsonb NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "activeFlowsWithAI" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "totalProjects" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "activeUsers" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "totalUsers" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "activeFlows" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "totalFlows" integer NOT NULL
        `)
    }

}
