import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddCanaryToPlatformPlan1774600000000 implements Migration {
    name = 'AddCanaryToPlatformPlan1774600000000'
    breaking = false
    release = '0.81.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "canary" boolean NOT NULL DEFAULT false')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "canary"')
    }

}
