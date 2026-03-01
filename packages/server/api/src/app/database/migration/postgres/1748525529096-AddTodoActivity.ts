import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTodoActivity1748525529096 implements MigrationInterface {
    name = 'AddTodoActivity1748525529096'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "todo_activity" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "todoId" character varying(21) NOT NULL,
                "userId" character varying(21),
                "agentId" character varying(21),
                "content" character varying NOT NULL,
                CONSTRAINT "PK_26f3e77e6ab71cf79485f4bc5d1" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_todo_id" ON "todo_activity" ("todoId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_user_id" ON "todo_activity" ("userId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_agent_id" ON "todo_activity" ("agentId")
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD "locked" boolean NOT NULL DEFAULT false
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_agent_id" ON "todo" ("agentId")
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity"
            ADD CONSTRAINT "fk_todo_activity_todo_id" FOREIGN KEY ("todoId") REFERENCES "todo"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity"
            ADD CONSTRAINT "fk_todo_activity_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity"
            ADD CONSTRAINT "FK_a70ac10a601ca72584dff95e0d0" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo_activity" DROP CONSTRAINT "FK_a70ac10a601ca72584dff95e0d0"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity" DROP CONSTRAINT "fk_todo_activity_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity" DROP CONSTRAINT "fk_todo_activity_todo_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_agent_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP COLUMN "locked"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_todo_id"
        `)
        await queryRunner.query(`
            DROP TABLE "todo_activity"
        `)
    }

}
