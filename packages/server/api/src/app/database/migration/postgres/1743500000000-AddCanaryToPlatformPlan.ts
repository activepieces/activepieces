import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCanaryToPlatformPlan1743500000000 implements MigrationInterface {
    name = 'AddCanaryToPlatformPlan1743500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "canary" boolean NOT NULL DEFAULT false')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "canary"')
    }

}
