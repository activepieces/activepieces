import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class AddEnableEmailAuthToPlatform1704797979825
implements MigrationInterface {
    name = 'AddEnableEmailAuthToPlatform1704797979825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "platform" ADD "emailAuthEnabled" boolean',
        )
        await queryRunner.query('UPDATE "platform" SET "emailAuthEnabled" = TRUE')
        await queryRunner.query(
            'ALTER TABLE "platform" ALTER COLUMN "emailAuthEnabled" SET NOT NULL',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "emailAuthEnabled"
        `)
    }
}
