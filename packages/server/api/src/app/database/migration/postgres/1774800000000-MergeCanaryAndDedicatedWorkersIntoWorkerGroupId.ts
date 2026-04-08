import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'

const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class MergeCanaryAndDedicatedWorkersIntoWorkerGroupId1774800000000 implements MigrationInterface {
    name = 'MergeCanaryAndDedicatedWorkersIntoWorkerGroupId1774800000000'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "workerGroupId" varchar NULL')
        await queryRunner.query('UPDATE "platform_plan" SET "workerGroupId" = \'canary\' WHERE "canary" = true')
        await queryRunner.query('UPDATE "platform_plan" SET "workerGroupId" = "platformId" WHERE "dedicatedWorkers" IS NOT NULL AND "canary" = false')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_platform_plan_canary"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "canary"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "dedicatedWorkers"')
        if (isPGlite) {
            await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_platform_plan_worker_group_id" ON "platform_plan" ("workerGroupId") WHERE "workerGroupId" IS NOT NULL')
        }
        else {
            await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_platform_plan_worker_group_id" ON "platform_plan" ("workerGroupId") WHERE "workerGroupId" IS NOT NULL')
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_platform_plan_worker_group_id"')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "canary" boolean NOT NULL DEFAULT false')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "dedicatedWorkers" jsonb NULL')
        await queryRunner.query('UPDATE "platform_plan" SET "canary" = true WHERE "workerGroupId" = \'canary\'')
        await queryRunner.query('UPDATE "platform_plan" SET "dedicatedWorkers" = \'{"trustedEnvironment": false}\' WHERE "workerGroupId" IS NOT NULL AND "workerGroupId" != \'canary\'')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "workerGroupId"')
        if (isPGlite) {
            await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_platform_plan_canary" ON "platform_plan" ("canary")')
        }
        else {
            await queryRunner.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_platform_plan_canary" ON "platform_plan" ("canary")')
        }
    }
}
