import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class IndexWaitpointLookups1847000000000 implements Migration {
    name = 'IndexWaitpointLookups1847000000000'
    breaking = false
    release = '0.92.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_waitpoint_signal_ref_id"`)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_waitpoint_signal_ref_id"
            ON "waitpoint_signal" ("refId", "projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_waitpoint_signal_waitpoint_id_project_id_sequence"
            ON "waitpoint_signal" ("waitpointId", "projectId", "sequence", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_waitpoint_flow_run_id_status_created"
            ON "waitpoint" ("flowRunId", "status", "created")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_waitpoint_flow_run_id_status_created"`)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_waitpoint_signal_waitpoint_id_project_id_sequence"`)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_waitpoint_signal_ref_id"`)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_waitpoint_signal_ref_id"
            ON "waitpoint_signal" ("refId")
        `)
    }
}

const concurrently = (): string => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE ? '' : 'CONCURRENTLY'
