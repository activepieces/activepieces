import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAnalyticsReport1766038629198 implements MigrationInterface {
    name = 'AddAnalyticsReport1766038629198'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "platform_analytics_report" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "estimatedTimeSavedPerStep" integer,
                "platformId" character varying NOT NULL,
                "outdated" boolean NOT NULL,
                "totalFlows" integer NOT NULL,
                "activeFlows" integer NOT NULL,
                "totalUsers" integer NOT NULL,
                "activeUsers" integer NOT NULL,
                "totalProjects" integer NOT NULL,
                "activeFlowsWithAI" integer NOT NULL,
                "totalFlowRuns" integer NOT NULL,
                "topPieces" jsonb NOT NULL,
                "topProjects" jsonb NOT NULL,
                "runsUsage" jsonb NOT NULL,
                "flowsDetails" jsonb NOT NULL,
                CONSTRAINT "REL_d2a0169d4bc6ede39dc05c9ca0" UNIQUE ("platformId"),
                CONSTRAINT "PK_8b060dc8b2e5d9d91162ce2cc11" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "timeSavedPerRun" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD CONSTRAINT "fk_platform_analytics_report_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP CONSTRAINT "fk_platform_analytics_report_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "timeSavedPerRun"
        `)
        await queryRunner.query(`
            DROP TABLE "platform_analytics_report"
        `)
    }

}
