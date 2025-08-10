import { MigrationInterface, QueryRunner } from 'typeorm'

export class EligibileForTrial1754852385518 implements MigrationInterface {
    name = 'EligibileForTrial1754852385518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "eligibleForTrial"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "eligibleForPlusTrial" boolean NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "eligibleForBusinessTrial" boolean NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeBillingCycle" DROP DEFAULT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeBillingCycle"
            SET DEFAULT 'monthly'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "eligibleForBusinessTrial"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "eligibleForPlusTrial"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "eligibleForTrial" boolean NOT NULL
        `)
    }

}
