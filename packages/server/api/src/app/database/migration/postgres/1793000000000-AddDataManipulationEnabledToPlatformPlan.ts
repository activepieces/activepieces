import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddDataManipulationEnabledToPlatformPlan1793000000000 implements Migration {
    name = 'AddDataManipulationEnabledToPlatformPlan1793000000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "dataManipulationEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "dataManipulationEnabled" = false
            WHERE "dataManipulationEnabled" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "dataManipulationEnabled"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "dataManipulationEnabled"')
    }
}
