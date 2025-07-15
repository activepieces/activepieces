import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTrialFlagInPlatform1751394161203 implements MigrationInterface {
    name = 'AddTrialFlagInPlatform1751394161203'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "eligibleForTrial" boolean
        `)

        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "eligibleForTrial" = false
        `)

        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "eligibleForTrial" SET NOT NULL
        `)

        await queryRunner.query(`
            UPDATE "platform_plan" 
            SET "eligibleForTrial" = true
            WHERE "plan" IN ('free', 'payg')
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "eligibleForTrial"
        `)
    }

}
