import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeManualTasksToTodo1742432827826 implements MigrationInterface {
    name = 'ChangeManualTasksToTodo1742432827826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS manual_task_comment
        `)
        await queryRunner.query(`
            DROP TABLE IF EXISTS manual_task
        `)
        await queryRunner.query(`
            CREATE TABLE "todo" (
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
                CONSTRAINT "PK_d429b7114371f6a35c5cb4776a7" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX idx_todo_project_id ON "todo" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX idx_todo_flow_id ON "todo" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX idx_todo_platform_id ON "todo" ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "fk_todo_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "fk_todo_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "fk_todo_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "fk_todo_run_id" FOREIGN KEY ("runId") REFERENCES "flow_run"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "fk_todo_assignee_id" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "fk_todo_assignee_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "fk_todo_run_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "fk_todo_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "fk_todo_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "fk_todo_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX idx_todo_platform_id
        `)
        await queryRunner.query(`
            DROP INDEX idx_todo_flow_id
        `)
        await queryRunner.query(`
            DROP INDEX idx_todo_project_id
        `)
        await queryRunner.query(`
            DROP TABLE "todo"
        `)
    }
}
