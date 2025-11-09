import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveUnusedPaymentMethodColoumn1762709208569 implements MigrationInterface {
    name = 'RemoveUnusedPaymentMethodColoumn1762709208569'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "stripePaymentMethod"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "stripePaymentMethod" character varying
        `)
    }

}
