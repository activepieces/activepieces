import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddScheduledUsersLimitToPlatformPlan1811000000000 implements Migration {
    name = 'AddScheduledUsersLimitToPlatformPlan1811000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "scheduledUsersLimit" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "scheduledUsersLimit"
        `)
    }
}
