import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'

export class AddPinnedOrder1686154285890 implements MigrationInterface {
    name = 'AddPinnedOrder1686154285890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query('ALTER TABLE "flow_template" DROP COLUMN "pinned"')
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "pinnedOrder" integer',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ALTER COLUMN "blogUrl" DROP NOT NULL',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "flow_template" ALTER COLUMN "blogUrl" SET NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "pinnedOrder"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "pinned" boolean NOT NULL',
        )
    }
}
