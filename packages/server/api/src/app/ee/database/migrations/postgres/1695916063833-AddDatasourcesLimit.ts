import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'

export class AddDatasourcesLimit1695916063833 implements MigrationInterface {
    name = 'AddDatasourcesLimit1695916063833'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        // Add the "datasources" column with a default value of 1
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "datasources" integer NOT NULL DEFAULT 1',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        // Remove the "datasources" column
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP COLUMN "datasources"',
        )
    }
}
