import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class UpdateAiCredits1751404517528 implements MigrationInterface {
    name = 'UpdateAiCredits1751404517528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageLimit" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageEnabled" boolean
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsLimit" integer NOT NULL
        `)
    }

}
