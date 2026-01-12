import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class AddTrialFlagInPlatform1751394161203 implements MigrationInterface {
    name = 'AddTrialFlagInPlatform1751394161203'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
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
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "eligibleForTrial"
        `)
    }

}
