import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddManualTaskTable1742304857701 implements MigrationInterface {
    name = 'AddManualTaskTable1742304857701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "manual_task" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "title" character varying NOT NULL,
                "description" character varying,
                "status" jsonb NOT NULL,
                "statusOptions" jsonb NOT NULL,
                "assigneeId" character varying(21),
                "platformId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "flowId" character varying(21) NOT NULL,
                "runId" character varying(21),
                "approvalUrl" character varying,
                CONSTRAINT "PK_b6956ec0d1c639c863c5254a1af" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_project_id" ON "manual_task" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_flow_id" ON "manual_task" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_platform_id" ON "manual_task" ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task"
            ADD CONSTRAINT "fk_manual_task_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task"
            ADD CONSTRAINT "fk_manual_task_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task"
            ADD CONSTRAINT "fk_manual_task_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task"
            ADD CONSTRAINT "fk_manual_task_run_id" FOREIGN KEY ("runId") REFERENCES "flow_run"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task"
            ADD CONSTRAINT "fk_manual_task_assignee_id" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "manual_task" DROP CONSTRAINT "fk_manual_task_assignee_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task" DROP CONSTRAINT "fk_manual_task_run_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task" DROP CONSTRAINT "fk_manual_task_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task" DROP CONSTRAINT "fk_manual_task_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task" DROP CONSTRAINT "fk_manual_task_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "manual_task"
        `)
    }

}
