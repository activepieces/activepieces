import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveMcpAndTablesLimitsAndBillingCycles1762103191643 implements MigrationInterface {
    name = 'RemoveMcpAndTablesLimitsAndBillingCycles1762103191643'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "tablesLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "mcpLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "stripeBillingCycle"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "stripeBillingCycle" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "mcpLimit" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "tablesLimit" integer
        `)
    }

}
