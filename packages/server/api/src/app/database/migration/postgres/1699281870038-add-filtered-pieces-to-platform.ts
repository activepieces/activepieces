import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class AddFilteredPiecesToPlatform1699281870038
implements MigrationInterface {
    name = 'AddFilteredPiecesToPlatform1699281870038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "filteredPieceNames" character varying array,
            ADD "filteredPieceBehavior" character varying
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET
                "filteredPieceNames" = '{}',
                "filteredPieceBehavior" = 'BLOCKED'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "filteredPieceNames" SET NOT NULL,
            ALTER COLUMN "filteredPieceBehavior" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "filteredPieceBehavior"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "filteredPieceNames"
        `)
    }
}
