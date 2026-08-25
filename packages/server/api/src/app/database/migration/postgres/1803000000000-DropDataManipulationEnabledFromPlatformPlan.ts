import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class DropDataManipulationEnabledFromPlatformPlan1803000000000 implements Migration {
    name = 'DropDataManipulationEnabledFromPlatformPlan1803000000000'
    breaking = false
    release = '0.85.6'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            DROP COLUMN IF EXISTS "dataManipulationEnabled"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "dataManipulationEnabled" boolean NOT NULL DEFAULT false
        `)
    }
}
