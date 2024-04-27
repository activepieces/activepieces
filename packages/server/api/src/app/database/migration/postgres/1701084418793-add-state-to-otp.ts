import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class AddStateToOtp1701084418793 implements MigrationInterface {
    name = 'AddStateToOtp1701084418793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "otp"
            ADD "state" character varying NOT NULL
        `)

        logger.info('AddStateToOtp1701084418793 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "otp" DROP COLUMN "state"
        `)

        logger.info('AddStateToOtp1701084418793 down')
    }
}
