import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddUniqueDispatchIndexPerFanInBarrier1822000000000 implements Migration {
    name = 'AddUniqueDispatchIndexPerFanInBarrier1822000000000'
    breaking = false
    release = '0.86.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "idx_run_parent_waitpoint_dispatch_index"
                ON "flow_run" ("parentWaitpointId", "dispatchIndex")
                WHERE "parentWaitpointId" IS NOT NULL AND "dispatchIndex" IS NOT NULL
            `)
            return
        }
        await queryRunner.query(`
            CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_parent_waitpoint_dispatch_index"
            ON "flow_run" ("parentWaitpointId", "dispatchIndex")
            WHERE "parentWaitpointId" IS NOT NULL AND "dispatchIndex" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_run_parent_waitpoint_dispatch_index"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
