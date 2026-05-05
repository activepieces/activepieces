import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMissingCascadeDeleteIndices1774100000000 implements MigrationInterface {
    name = 'AddMissingCascadeDeleteIndices1774100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE INDEX "idx_table_webhook_flow_id" ON "table_webhook" ("flowId")')
        await queryRunner.query('CREATE INDEX "idx_template_platform_id" ON "template" ("platformId")')
        await queryRunner.query('CREATE INDEX "idx_custom_domain_platform_id" ON "custom_domain" ("platformId")')
        await queryRunner.query('CREATE INDEX "idx_platform_analytics_report_platform_id" ON "platform_analytics_report" ("platformId")')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_platform_analytics_report_platform_id"')
        await queryRunner.query('DROP INDEX "idx_custom_domain_platform_id"')
        await queryRunner.query('DROP INDEX "idx_template_platform_id"')
        await queryRunner.query('DROP INDEX "idx_table_webhook_flow_id"')
    }
}
