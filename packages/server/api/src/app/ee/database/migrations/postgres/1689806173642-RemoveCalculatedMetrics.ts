import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'

export class RemoveCalculatedMetrics1689806173642
implements MigrationInterface {
    name = 'RemoveCalculatedMetrics1689806173642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_usage" DROP COLUMN "activeFlows"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" DROP COLUMN "connections"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" DROP COLUMN "teamMembers"',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_usage" ADD "teamMembers" integer NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ADD "connections" integer NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ADD "activeFlows" integer NOT NULL',
        )
    }
}
