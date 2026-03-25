import { MigrationInterface, QueryRunner } from 'typeorm'

export class LogFileRelationWithFlowRun1725639666232 implements MigrationInterface {
    name = 'LogFileRelationWithFlowRun1725639666232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD CONSTRAINT "fk_flow_run_logs_file_id" FOREIGN KEY ("logsFileId") REFERENCES "file"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query('DELETE FROM "file" WHERE "type" = \'UNKNOWN\' OR "type" = \'CODE_SOURCE\'')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_logs_file_id"
        `)
    }

}
