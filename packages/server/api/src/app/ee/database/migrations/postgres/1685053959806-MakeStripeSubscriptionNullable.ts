import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'
import { ApEdition } from '@activepieces/shared'

export class MakeStripeSubscriptionNullable1685053959806
implements MigrationInterface {
    name = 'MakeStripeSubscriptionNullable1685053959806'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_plan" ALTER COLUMN "stripeSubscriptionId" DROP NOT NULL',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "name" character varying NOT NULL',
        )
    }
}
