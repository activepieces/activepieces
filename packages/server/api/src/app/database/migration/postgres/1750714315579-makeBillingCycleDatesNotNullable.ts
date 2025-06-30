import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeBillingCycleDatesNotNullable1750714315579 implements MigrationInterface {
    name = 'MakeBillingCycleDatesNotNullable1750714315579'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeSubscriptionStartDate"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeSubscriptionEndDate"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeSubscriptionEndDate" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeSubscriptionStartDate" DROP NOT NULL
        `)
    }

}
