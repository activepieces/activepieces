import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddParentWaitpointIdToFlowRun1819000000000 implements Migration {
    name = 'AddParentWaitpointIdToFlowRun1819000000000'
    breaking = false
    release = '0.86.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN IF NOT EXISTS "parentWaitpointId" character varying(21)
        `)
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_run_parent_waitpoint_id" ON "flow_run" ("parentWaitpointId")
            `)
            return
        }
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_parent_waitpoint_id" ON "flow_run" ("parentWaitpointId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_run_parent_waitpoint_id"')
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "parentWaitpointId"
        `)
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
