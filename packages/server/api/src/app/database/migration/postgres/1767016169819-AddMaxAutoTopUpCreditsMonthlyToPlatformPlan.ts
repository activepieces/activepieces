import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMaxAutoTopUpCreditsMonthlyToPlatformPlan1767016169819 implements MigrationInterface {
    name = 'AddMaxAutoTopUpCreditsMonthlyToPlatformPlan1767016169819'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "maxAutoTopUpCreditsMonthly" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "maxAutoTopUpCreditsMonthly"
        `)
    }

}
