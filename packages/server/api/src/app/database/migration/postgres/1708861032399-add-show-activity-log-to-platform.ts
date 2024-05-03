import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class AddShowActivityLogToPlatform1708861032399 implements MigrationInterface {
    name = 'AddShowActivityLogToPlatform1708861032399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "showActivityLog" boolean
        `)

        await queryRunner.query(`
            UPDATE "platform"
            SET "showActivityLog" = false
        `)

        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "showActivityLog" SET NOT NULL
        `)

        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "showActivityLog"
        `)

        logger.info({ name: this.name }, 'down')
    }

}
