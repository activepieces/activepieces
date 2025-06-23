import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddManualTaskCommentTable1742305104390 implements MigrationInterface {
    name = 'AddManualTaskCommentTable1742305104390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "manual_task_comment" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "taskId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "content" character varying NOT NULL,
                CONSTRAINT "PK_5d60c01f4c4a9d8120f284bacab" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_comment_task_id" ON "manual_task_comment" ("taskId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_comment_user_id" ON "manual_task_comment" ("userId")
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task_comment"
            ADD CONSTRAINT "fk_manual_task_comment_task_id" FOREIGN KEY ("taskId") REFERENCES "manual_task"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task_comment"
            ADD CONSTRAINT "fk_manual_task_comment_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "manual_task_comment" DROP CONSTRAINT "fk_manual_task_comment_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task_comment" DROP CONSTRAINT "fk_manual_task_comment_task_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_comment_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_comment_task_id"
        `)
        await queryRunner.query(`
            DROP TABLE "manual_task_comment"
        `)
    }

}
