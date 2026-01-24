import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class UpdateNotifyStatusOnEmbedding1741963410825 implements MigrationInterface {
    name = 'UpdateNotifyStatusOnEmbedding1741963410825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            UPDATE "project"
            SET "notifyStatus" = 'NEVER'
            WHERE "platformId" IN (
                SELECT "id" FROM "platform" WHERE "embeddingEnabled" = true
            )
        `)

    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // 
    }

}
