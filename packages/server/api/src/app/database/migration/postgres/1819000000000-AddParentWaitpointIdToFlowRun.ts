import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

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
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN IF NOT EXISTS "branch" jsonb
        `)
        if (isPGlite) {
            await queryRunner.query(`
                CREATE INDEX "idx_run_parent_waitpoint_id_status" ON "flow_run" ("parentWaitpointId", "status")
                WHERE "parentWaitpointId" IS NOT NULL
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY "idx_run_parent_waitpoint_id_status" ON "flow_run" ("parentWaitpointId", "status")
                WHERE "parentWaitpointId" IS NOT NULL
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query(`
                DROP INDEX "idx_run_parent_waitpoint_id_status"
            `)
        }
        else {
            await queryRunner.query(`
                DROP INDEX CONCURRENTLY "idx_run_parent_waitpoint_id_status"
            `)
        }
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "branch"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "parentWaitpointId"
        `)
    }
}
