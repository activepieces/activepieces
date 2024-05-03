import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'
import { ApEdition } from '@activepieces/shared'

export class AddAppSumo1688943462327 implements MigrationInterface {
    name = 'AddAppSumo1688943462327'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(
            'CREATE TABLE "appsumo" ("uuid" character varying NOT NULL, "plan_id" character varying NOT NULL, "activation_email" character varying NOT NULL, CONSTRAINT "PK_3589df5be2973351814f727ae86" PRIMARY KEY ("uuid"))',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query('DROP TABLE "appsumo"')
    }
}
