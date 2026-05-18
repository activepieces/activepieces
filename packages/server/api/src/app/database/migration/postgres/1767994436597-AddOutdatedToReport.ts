import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOutdatedToReport1767994436597 implements MigrationInterface {
    name = 'AddOutdatedToReport1767994436597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            TRUNCATE TABLE "platform_analytics_report"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "outdated" boolean NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "outdated"
        `)
    }

}
