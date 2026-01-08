import { MigrationInterface, QueryRunner } from "typeorm";

export class ReportCache1767885705290 implements MigrationInterface {
    name = 'ReportCache1767885705290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "platform_analytics_report_cache" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "cachedAt" TIMESTAMP NOT NULL,
                "runsUsage" jsonb NOT NULL,
                "flowsDetails" jsonb NOT NULL,
                "timeSaved" integer NOT NULL,
                CONSTRAINT "REL_c52d6bbaf3344216e54ce35cb2" UNIQUE ("platformId"),
                CONSTRAINT "PK_4ce672a084d96f40ded86ac86d5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report_cache"
            ADD CONSTRAINT "fk_platform_analytics_report_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report_cache" DROP CONSTRAINT "fk_platform_analytics_report_platform_id"
        `);
        await queryRunner.query(`
            DROP TABLE "platform_analytics_report_cache"
        `);
    }

}
