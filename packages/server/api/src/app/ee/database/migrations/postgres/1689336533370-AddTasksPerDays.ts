import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'

export class AddTasksPerDays1689336533370 implements MigrationInterface {
    name = 'AddTasksPerDays1689336533370'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "tasksPerDay" integer',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ALTER COLUMN "minimumPollingInterval" DROP DEFAULT',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ALTER COLUMN "activeFlows" DROP DEFAULT',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ALTER COLUMN "connections" DROP DEFAULT',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ALTER COLUMN "teamMembers" DROP DEFAULT',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ALTER COLUMN "activeFlows" DROP DEFAULT',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ALTER COLUMN "connections" DROP DEFAULT',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ALTER COLUMN "teamMembers" DROP DEFAULT',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_usage" ALTER COLUMN "teamMembers" SET DEFAULT \'0\'',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ALTER COLUMN "connections" SET DEFAULT \'0\'',
        )
        await queryRunner.query(
            'ALTER TABLE "project_usage" ALTER COLUMN "activeFlows" SET DEFAULT \'0\'',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ALTER COLUMN "teamMembers" SET DEFAULT \'1\'',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ALTER COLUMN "connections" SET DEFAULT \'100\'',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ALTER COLUMN "activeFlows" SET DEFAULT \'100\'',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" ALTER COLUMN "minimumPollingInterval" SET DEFAULT \'5\'',
        )
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP COLUMN "tasksPerDay"',
        )
    }
}
