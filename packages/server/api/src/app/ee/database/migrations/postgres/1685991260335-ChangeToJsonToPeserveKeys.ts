import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'
import { ApEdition } from '@activepieces/shared'

export class ChangeToJsonToKeepKeysOrder1685991260335
implements MigrationInterface {
    name = 'ChangeToJsonToKeepKeysOrder1685991260335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" DROP COLUMN "actions"',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ADD "actions" json NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" DROP COLUMN "triggers"',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ADD "triggers" json NOT NULL',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" DROP COLUMN "triggers"',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ADD "triggers" jsonb NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" DROP COLUMN "actions"',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ADD "actions" jsonb NOT NULL',
        )
    }
}
