import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLogsFileIdIndexSqlite1725699920020 implements MigrationInterface {
    name = 'AddLogsFileIdIndexSqlite1725699920020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_file_project_id" ON "file" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_file_type_created_desc" ON "file" ("type", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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

}
