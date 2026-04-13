import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class MergeCanaryAndDedicatedWorkersIntoWorkerGroupId1775656136000 implements Migration {
    name = 'MergeCanaryAndDedicatedWorkersIntoWorkerGroupId1775656136000'
    breaking = false
    release = '0.82.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "workerGroupId" varchar NULL')
        await queryRunner.query('UPDATE "platform_plan" SET "workerGroupId" = \'canary\' WHERE "canary" = true')
        await queryRunner.query('UPDATE "platform_plan" SET "workerGroupId" = "platformId" WHERE "dedicatedWorkers" IS NOT NULL AND "canary" = false')
        if (isPGlite) {
            await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_platform_plan_worker_group_id" ON "platform_plan" ("workerGroupId") WHERE "workerGroupId" IS NOT NULL')
        }
        else {
            await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_platform_plan_worker_group_id" ON "platform_plan" ("workerGroupId") WHERE "workerGroupId" IS NOT NULL')
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_platform_plan_worker_group_id"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "workerGroupId"')
    }
}
