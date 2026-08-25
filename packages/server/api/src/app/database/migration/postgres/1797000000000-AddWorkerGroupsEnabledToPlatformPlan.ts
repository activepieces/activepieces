import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddWorkerGroupsEnabledToPlatformPlan1797000000000 implements Migration {
    name = 'AddWorkerGroupsEnabledToPlatformPlan1797000000000'
    breaking = false
    release = '0.85.5'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "workerGroupsEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "workerGroupsEnabled" = false
            WHERE "workerGroupsEnabled" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "workerGroupsEnabled"
            SET DEFAULT false
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "workerGroupsEnabled"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "workerGroupsEnabled"')
    }
}
