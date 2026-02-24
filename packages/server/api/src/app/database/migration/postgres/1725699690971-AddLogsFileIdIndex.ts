import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()
const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE


export class AddLogsFileIdIndex1725699690971 implements MigrationInterface {
    name = 'AddLogsFileIdIndex1725699690971'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrent = !isPGlite

        if (concurrent) {
            // Create indexes concurrently does not run in a transaction (Postgres only)
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY "idx_file_project_id" ON "file" ("projectId")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX "idx_file_project_id" ON "file" ("projectId")
            `)
        }
        log.info({ name: this.name }, 'idx_file_project_id is up')

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY "idx_file_type_created_desc" ON "file" ("type", "created")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX "idx_file_type_created_desc" ON "file" ("type", "created")
            `)
        }
        log.info({ name: this.name }, 'idx_file_type_created_desc is up')

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
            `)
        }
        log.info({ name: this.name }, 'idx_run_logs_file_id is up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const concurrent = !isPGlite

        if (concurrent) {
            await queryRunner.query(`
                DROP INDEX CONCURRENTLY "idx_run_logs_file_id"
            `)
            await queryRunner.query(`
                DROP INDEX CONCURRENTLY "idx_file_type_created_desc"
            `)
            await queryRunner.query(`
                DROP INDEX CONCURRENTLY "idx_file_project_id"
            `)
        }
        else {
            await queryRunner.query(`
                DROP INDEX "idx_run_logs_file_id"
            `)
            await queryRunner.query(`
                DROP INDEX "idx_file_type_created_desc"
            `)
            await queryRunner.query(`
                DROP INDEX "idx_file_project_id"
            `)
        }
        log.info({
            name: this.name,
        }, 'is down')
    }

}