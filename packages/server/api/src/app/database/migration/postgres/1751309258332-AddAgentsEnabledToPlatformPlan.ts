import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class AddAgentsEnabledToPlatformPlan1751309258332 implements MigrationInterface {
    name = 'AddAgentsEnabledToPlatformPlan1751309258332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "agentsEnabled" boolean
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
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "agentsEnabled"
        `)
    }

}
