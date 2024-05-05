import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class AddGitSyncEnabledToPlatform1704636362533
implements MigrationInterface {
    name = 'AddGitSyncEnabledToPlatform1704636362533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "gitSyncEnabled" boolean
        `)

        await queryRunner.query(`
            UPDATE "platform"
            SET "gitSyncEnabled" = false
        `)

        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "gitSyncEnabled" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "gitSyncEnabled"
        `)
    }
}
