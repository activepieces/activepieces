import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBillingCycle1754559781173 implements MigrationInterface {
    name = 'AddBillingCycle1754559781173'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "stripeBillingCycle" character varying NOT NULL DEFAULT 'monthly'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "stripeBillingCycle"
        `)
    }
}