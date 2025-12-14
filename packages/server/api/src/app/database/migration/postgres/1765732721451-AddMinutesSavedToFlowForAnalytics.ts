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
            ALTER TABLE "flow"
            ADD "minutesSaved" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "totalFlowRuns" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "totalMinutesSaved" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "flowsDetails" jsonb NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "flowsDetails"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "totalMinutesSaved"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "totalFlowRuns"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "minutesSaved"
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
