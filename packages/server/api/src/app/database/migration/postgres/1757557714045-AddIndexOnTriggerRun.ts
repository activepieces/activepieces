import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

export class AddIndexOnTriggerRun1757557714045 implements MigrationInterface {
    name = 'AddIndexOnTriggerRun1757557714045'

    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        system.globalLogger().info({
            name: 'AddIndexOnTriggerRun1757557714045',
            message: 'up',
        })
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP CONSTRAINT IF EXISTS "fk_trigger_run_flow_id";
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP CONSTRAINT IF EXISTS "fk_trigger_run_payload_file_id";
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP COLUMN IF EXISTS "flowId";
        `)

        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD CONSTRAINT "fk_trigger_run_payload_file_id" FOREIGN KEY ("payloadFileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE NO ACTION NOT VALID;
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trigger_run_trigger_source_id" 
            ON "trigger_run" ("triggerSourceId");
        `)

        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trigger_run_payload_file_id" 
            ON "trigger_run" ("payloadFileId");
        `)
        system.globalLogger().info({
            name: 'AddIndexOnTriggerRun1757557714045',
            message: 'completed',
        })
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP CONSTRAINT "fk_trigger_run_payload_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_trigger_source_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD "flowId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD CONSTRAINT "fk_trigger_run_payload_file_id" FOREIGN KEY ("payloadFileId") REFERENCES "file"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD CONSTRAINT "fk_trigger_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_payload_file_id"
        `)
    }

}
