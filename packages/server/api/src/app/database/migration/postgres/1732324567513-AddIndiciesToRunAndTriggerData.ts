import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddIndiciesToRunAndTriggerData1732324567513 implements MigrationInterface {
    name = 'AddIndiciesToRunAndTriggerData1732324567513'
    transaction = false
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrent = !isPGlite

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trigger_event_project_id_flow_id" ON "trigger_event" ("projectId", "flowId")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_trigger_event_project_id_flow_id" ON "trigger_event" ("projectId", "flowId")
            `)
        }

        if (concurrent) {
            await queryRunner.query(`
                CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_trigger_event_file_id" ON "trigger_event" ("fileId")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "idx_trigger_event_file_id" ON "trigger_event" ("fileId")
            `)
        }

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_flow_id" ON "flow_run" ("flowId")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_run_flow_id" ON "flow_run" ("flowId")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_trigger_event_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_trigger_event_project_id_flow_id"
        `)
    }

}