import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeStripeSubscriptionNullable1685053959806
implements MigrationInterface {
    name = 'MakeStripeSubscriptionNullable1685053959806'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "project_plan" ALTER COLUMN "stripeSubscriptionId" DROP NOT NULL',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "name" character varying NOT NULL',
        )
    }
}
