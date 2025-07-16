import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBillingCycleDates1750704192423 implements MigrationInterface {
    name = 'AddBillingCycleDates1750704192423'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "stripeSubscriptionStartDate" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "stripeSubscriptionEndDate" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "stripeSubscriptionCancelDate" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "stripeSubscriptionCancelDate"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "stripeSubscriptionEndDate"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "stripeSubscriptionStartDate"
        `)
    }

}
