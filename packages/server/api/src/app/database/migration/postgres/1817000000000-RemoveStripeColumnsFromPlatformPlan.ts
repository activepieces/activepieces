import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class RemoveStripeColumnsFromPlatformPlan1817000000000 implements Migration {
    name = 'RemoveStripeColumnsFromPlatformPlan1817000000000'
    breaking = true
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "stripeCustomerId"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "stripeSubscriptionId"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "stripeSubscriptionStatus"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "stripeSubscriptionStartDate"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "stripeSubscriptionEndDate"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "stripeSubscriptionCancelDate"')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "stripeCustomerId" character varying')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "stripeSubscriptionId" character varying')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "stripeSubscriptionStatus" character varying')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "stripeSubscriptionStartDate" integer')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "stripeSubscriptionEndDate" integer')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "stripeSubscriptionCancelDate" integer')
    }
}
