import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class AddLengthLimitsToActivity1708529586342 implements MigrationInterface {
    name = 'AddLengthLimitsToActivity1708529586342'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "activity"
                ALTER COLUMN "event" TYPE character varying(200) USING "event"::character varying(200),
                ALTER COLUMN "message" TYPE character varying(2000) USING "message"::character varying(2000),
                ALTER COLUMN "status" TYPE character varying(100) USING "status"::character varying(100)
        `)

        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "activity"
                ALTER COLUMN "event" TYPE character varying USING "event"::character varying,
                ALTER COLUMN "message" TYPE character varying USING "message"::character varying,
                ALTER COLUMN "status" TYPE character varying USING "status"::character varying
        `)

        logger.info({ name: this.name }, 'down')
    }
}
