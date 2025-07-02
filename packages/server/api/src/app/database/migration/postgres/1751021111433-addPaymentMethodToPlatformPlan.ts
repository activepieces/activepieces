import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPaymentMethodToPlatformPlan1751021111433 implements MigrationInterface {
    name = 'AddPaymentMethodToPlatformPlan1751021111433'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "stripePaymentMethod" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "stripePaymentMethod"
        `)
    }

}
