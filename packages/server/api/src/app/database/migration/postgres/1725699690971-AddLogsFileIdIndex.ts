import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLogsFileIdIndex1725699690971 implements MigrationInterface {
    name = 'AddLogsFileIdIndex1725699690971'
    transaction = false
    public async up(queryRunner: QueryRunner): Promise<void> {

        // Create indexes concurrently does not run in a transaction
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY "idx_file_project_id" ON "file" ("projectId")
        `)
        logger.info({
            name: this.name,
        }, 'idx_file_project_id is up')
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY "idx_file_type_created_desc" ON "file" ("type", "created")
        `)
        logger.info({
            name: this.name,
        }, 'idx_file_type_created_desc is up')

        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
        `)
        logger.info({
            name: this.name,
        }, 'idx_run_logs_file_id is up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX CONCURRENTLY "public"."idx_run_logs_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX CONCURRENTLY "public"."idx_file_type_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX CONCURRENTLY "public"."idx_file_project_id"
        `)
        logger.info({
            name: this.name,
        }, 'is down')
    }

}
