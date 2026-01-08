import { MigrationInterface, QueryRunner } from "typeorm";

export class ReportCacheMany1767886807288 implements MigrationInterface {
    name = 'ReportCacheMany1767886807288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report_cache" DROP CONSTRAINT "fk_platform_analytics_report_platform_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report_cache" DROP CONSTRAINT "REL_c52d6bbaf3344216e54ce35cb2"
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
            ALTER TABLE "platform_analytics_report_cache"
            ADD CONSTRAINT "REL_c52d6bbaf3344216e54ce35cb2" UNIQUE ("platformId")
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report_cache"
            ADD CONSTRAINT "fk_platform_analytics_report_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

}
