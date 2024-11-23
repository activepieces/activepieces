import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndiciesToRunAndTriggerData1732324567513 implements MigrationInterface {
    name = 'AddIndiciesToRunAndTriggerData1732324567513'
    transaction = false
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY "idx_trigger_event_project_id_flow_id" ON "trigger_event" ("projectId", "flowId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX CONCURRENTLY "idx_trigger_event_file_id" ON "trigger_event" ("fileId")
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY "idx_run_flow_id" ON "flow_run" ("flowId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX CONCURRENTLY "public"."idx_run_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX CONCURRENTLY "public"."idx_trigger_event_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX CONCURRENTLY "public"."idx_trigger_event_project_id_flow_id"
        `)
    }

}
