import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class AddEmbeddingFeatureToPlatform1701794452891
implements MigrationInterface {
    name = 'AddEmbeddingFeatureToPlatform1701794452891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "embeddingEnabled" boolean NOT NULL DEFAULT true
        `)

        await queryRunner.query(`
            UPDATE "platform"
            SET "embeddingEnabled" = true
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "embeddingEnabled"
        `)
    }
}
