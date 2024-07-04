import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'

export class AddBillingParameters1688739844617 implements MigrationInterface {
    name = 'AddBillingParameters1688739844617'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "minimumPollingInterval" integer NOT NULL DEFAULT 5',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "activeFlows" integer NOT NULL DEFAULT 100',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "connections" integer NOT NULL DEFAULT 100',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "teamMembers" integer NOT NULL DEFAULT 1',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ADD "activeFlows" integer NOT NULL DEFAULT 0',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ADD "connections" integer NOT NULL DEFAULT 0',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ADD "teamMembers" integer NOT NULL DEFAULT 0',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_usage" DROP COLUMN "teamMembers"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" DROP COLUMN "connections"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" DROP COLUMN "activeFlows"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP COLUMN "teamMembers"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP COLUMN "connections"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP COLUMN "activeFlows"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP COLUMN "minimumPollingInterval"',
        )
    }
}
