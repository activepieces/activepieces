import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeManualTasksCommentsToTodoComments1742433144687 implements MigrationInterface {
    name = 'ChangeManualTasksCommentsToTodoComments1742433144687'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "todo_comment" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "todoId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "content" character varying NOT NULL,
                CONSTRAINT "PK_839f4b538f52d8030ecf2367e4c" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_comment_todo_id" ON "todo_comment" ("todoId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_comment_user_id" ON "todo_comment" ("userId")
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_comment"
            ADD CONSTRAINT "fk_todo_comment_todo_id" FOREIGN KEY ("todoId") REFERENCES "todo"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_comment"
            ADD CONSTRAINT "fk_todo_comment_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo_comment" DROP CONSTRAINT "fk_todo_comment_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_comment" DROP CONSTRAINT "fk_todo_comment_todo_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_comment_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_comment_todo_id"
        `)
        await queryRunner.query(`
            DROP TABLE "todo_comment"
        `)
    }

}
