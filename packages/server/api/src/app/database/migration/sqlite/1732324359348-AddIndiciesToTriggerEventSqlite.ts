import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndiciesToTriggerEventSqlite1732324359348 implements MigrationInterface {
    name = 'AddIndiciesToTriggerEventSqlite1732324359348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_project_id_flow_id" ON "trigger_event" ("projectId", "flowId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_event_file_id" ON "trigger_event" ("fileId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_project_id_flow_id"
        `)
    }

}
