import { MigrationInterface, QueryRunner } from 'typeorm'

export class ReAddAgentsEnabledToPlatformPlan1774000000000 implements MigrationInterface {
    name = 'ReAddAgentsEnabledToPlatformPlan1774000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "agentsEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "agentsEnabled" = NOT "embeddingEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "agentsEnabled" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "agentsEnabled"
        `)
    }

}
