import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'
import { ApEdition } from '@activepieces/shared'

export class ModifyBilling1694902537045 implements MigrationInterface {
    name = 'ModifyBilling1694902537045'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_plan" RENAME COLUMN "name" TO "flowPlanName"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "botPlanName" character varying NOT NULL DEFAULT \'free\'',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "bots" integer NOT NULL DEFAULT 1',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "datasourcesSize" integer NOT NULL DEFAULT 10485760',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ADD "datasourcesSize" integer NOT NULL DEFAULT \'0\'',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ADD "bots" integer NOT NULL DEFAULT \'0\'',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query('ALTER TABLE "project_usage" DROP COLUMN "bots"')
        await queryRunner.query(
            'ALTER TABLE "project_usage" DROP COLUMN "datasourcesSize"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP COLUMN "datasourcesSize"',
        )
        await queryRunner.query('ALTER TABLE "project_plan" DROP COLUMN "bots"')
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP COLUMN "botPlanName"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP COLUMN "flowPlanName"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "name" character varying NOT NULL',
        )
    }
}
