import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateCacheStructure1767904545112 implements MigrationInterface {
    name = 'UpdateCacheStructure1767904545112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('TRUNCATE TABLE "platform_analytics_report"')
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "topPieces"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "runsUsage"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "estimatedTimeSavedPerStep"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "outdated"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "flowsDetails"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "cachedAt" TIMESTAMP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "runs" jsonb NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "flows" jsonb NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP CONSTRAINT "fk_platform_analytics_report_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP CONSTRAINT "REL_d2a0169d4bc6ede39dc05c9ca0"
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
            ALTER TABLE "platform_analytics_report"
            ADD CONSTRAINT "REL_d2a0169d4bc6ede39dc05c9ca0" UNIQUE ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD CONSTRAINT "fk_platform_analytics_report_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "flows"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "runs"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "cachedAt"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "flowsDetails" jsonb NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "outdated" boolean NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "estimatedTimeSavedPerStep" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "runsUsage" jsonb NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "topPieces" jsonb NOT NULL
        `)
    }

}
