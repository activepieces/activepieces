import { logger } from "@activepieces/server-shared";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLogsFileIdIndex1725699690971 implements MigrationInterface {
    name = 'AddLogsFileIdIndex1725699690971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_file_project_id" ON "file" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_file_type_created_desc" ON "file" ("type", "created")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
        `);
        logger.info({
            name: this.name,
        }, 'is up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_run_logs_file_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_file_type_created_desc"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_file_project_id"
        `);
        logger.info({
            name: this.name,
        }, 'is down')
    }

}
