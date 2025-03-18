import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeRunIdOptionalManualTasks1742247665482 implements MigrationInterface {
    name = 'MakeRunIdOptionalManualTasks1742247665482'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "manual_task" DROP CONSTRAINT "fk_manual_task_run_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task"
            ALTER COLUMN "runId" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task"
            ADD CONSTRAINT "fk_manual_task_run_id" FOREIGN KEY ("runId") REFERENCES "flow_run"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "manual_task" DROP CONSTRAINT "fk_manual_task_run_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task"
            ALTER COLUMN "runId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task"
            ADD CONSTRAINT "fk_manual_task_run_id" FOREIGN KEY ("runId") REFERENCES "flow_run"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}
