import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { BACKGROUND_MIGRATIONS_TABLE } from '../../background-migration-runner'
import { Migration } from '../../migration'
import { migrationHelpers } from '../../migration-helpers'
import {
    FLOW_RUN_BARRIER_INDEXES,
    FLOW_RUN_LEGACY_LIST_INDEXES,
    ReshapeFlowRunListIndexesForBarrierChildren1871000000000,
} from './background/1871000000000-ReshapeFlowRunListIndexesForBarrierChildren'

export class AddBarrierChildAttribution1871000000000 implements Migration {
    name = 'AddBarrierChildAttribution1871000000000'
    breaking = false
    release = '0.93.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN IF NOT EXISTS "parentWaitpointId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN IF NOT EXISTS "dispatchIndex" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await migrationHelpers.withBackgroundMigrationLock({
            log: system.globalLogger(),
            migration: ReshapeFlowRunListIndexesForBarrierChildren1871000000000,
            fn: async () => {
                for (const index of FLOW_RUN_LEGACY_LIST_INDEXES) {
                    await migrationHelpers.createIndexConcurrently({ queryRunner, table: 'flow_run', ...index })
                }
                for (const index of FLOW_RUN_BARRIER_INDEXES) {
                    await migrationHelpers.dropIndexConcurrently({ queryRunner, name: index.name })
                }
                await queryRunner.query(
                    `DELETE FROM "${BACKGROUND_MIGRATIONS_TABLE}" WHERE "name" = $1`,
                    [new ReshapeFlowRunListIndexesForBarrierChildren1871000000000().name],
                )
                await queryRunner.query('ALTER TABLE "flow_run" DROP COLUMN IF EXISTS "dispatchIndex"')
                await queryRunner.query('ALTER TABLE "flow_run" DROP COLUMN IF EXISTS "parentWaitpointId"')
            },
        })
    }
}
