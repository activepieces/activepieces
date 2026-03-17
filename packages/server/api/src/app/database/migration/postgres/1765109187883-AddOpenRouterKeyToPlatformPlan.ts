import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOpenRouterKeyToPlatformPlan1765109187883 implements MigrationInterface {
    name = 'AddOpenRouterKeyToPlatformPlan1765109187883'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "aiCredits"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "openRouterApiKeyHash" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "openRouterApiKey" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "aiCredits" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "openRouterApiKeyHash"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "openRouterApiKey"
        `)
    }
}
