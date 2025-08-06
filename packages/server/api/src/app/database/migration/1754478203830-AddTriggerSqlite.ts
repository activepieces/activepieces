import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTriggerSqlite1754478203830 implements MigrationInterface {
    name = 'AddTriggerSqlite1754478203830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP CONSTRAINT "FK_d14e1444c9b2b55075702e6b177"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD CONSTRAINT "fk_trigger_run_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP CONSTRAINT "fk_trigger_run_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id" ON "trigger_run" ("triggerSourceId", "projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD CONSTRAINT "FK_d14e1444c9b2b55075702e6b177" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}
