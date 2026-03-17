import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveTasksAndTasksLimit1761570485475 implements MigrationInterface {
    name = 'RemoveTasksAndTasksLimit1761570485475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" RENAME COLUMN "tasks" TO "stepsCount"
        `)
        const hasProjectPlan = await queryRunner.hasTable('project_plan')
        if (hasProjectPlan) {
            await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "tasks"
        `)

        }

        const hasPlatformAnalyticsReport = await queryRunner.hasTable('platform_analytics_report')
        if (hasPlatformAnalyticsReport) {
            await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "tasksUsage"
        `)
        }

        const hasPlatformPlan = await queryRunner.hasTable('platform_plan')
        if (hasPlatformPlan) {
            await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "tasksLimit"
        `)
            await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeBillingCycle" DROP DEFAULT
        `)

        }
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"
        `)

        const hasPlatformPlan = await queryRunner.hasTable('platform_plan')
        if (hasPlatformPlan) {
            await queryRunner.query(`
                ALTER TABLE "platform_plan"
                ALTER COLUMN "stripeBillingCycle"
                SET DEFAULT 'monthly'
            `)
            await queryRunner.query(`
                ALTER TABLE "platform_plan"
                ADD "tasksLimit" integer
            `)
        }
        const hasProjectPlan = await queryRunner.hasTable('project_plan')
        if (hasProjectPlan) {

            await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "tasks" integer
        `)
        }

        const hasPlatformAnalyticsReport = await queryRunner.hasTable('platform_analytics_report')
        if (hasPlatformAnalyticsReport) {
            await queryRunner.query(`
                ALTER TABLE "platform_analytics_report"
                ADD "tasksUsage" jsonb NOT NULL
            `)
        }
        await queryRunner.query(`
            ALTER TABLE "flow_run" RENAME COLUMN "stepsCount" TO "tasks"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
    }

}
