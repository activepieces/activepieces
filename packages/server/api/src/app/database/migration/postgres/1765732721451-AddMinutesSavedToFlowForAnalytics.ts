import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMinutesSavedToFlowForAnalytics1765732721451 implements MigrationInterface {
    name = 'AddMinutesSavedToFlowForAnalytics1765732721451'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "activeProjects"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "uniquePiecesUsed"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" ADD COLUMN "estimatedTimeSavedPerStep" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" ADD COLUMN "outdated" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_analytics_report" SET "outdated" = false WHERE "outdated" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" ALTER COLUMN "outdated" SET NOT NULL
        `)
        await queryRunner.query(`
            UPDATE platform_plan SET "analyticsEnabled" = true
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "timeSavedPerRun" integer
        `)
        // Add "totalFlowRuns" as nullable, set default, then make not null
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "totalFlowRuns" integer
        `)
        await queryRunner.query(`
            UPDATE "platform_analytics_report"
            SET "totalFlowRuns" = 0
            WHERE "totalFlowRuns" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ALTER COLUMN "totalFlowRuns" SET NOT NULL
        `)
        // Add "flowsDetails" as nullable, set default, then make not null
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "flowsDetails" jsonb
        `)
        await queryRunner.query(`
            UPDATE "platform_analytics_report"
            SET "flowsDetails" = '[]'
            WHERE "flowsDetails" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ALTER COLUMN "flowsDetails" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "outdated"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "flowsDetails"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "estimatedTimeSavedPerStep"
        `)

        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "totalFlowRuns"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "timeSavedPerRun"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "uniquePiecesUsed" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "activeProjects" integer NOT NULL
        `)
    }

}
