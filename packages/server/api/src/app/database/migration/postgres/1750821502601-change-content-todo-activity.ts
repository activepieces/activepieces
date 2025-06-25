import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeContentTodoActivity1750821502601 implements MigrationInterface {
    name = 'ChangeContentTodoActivity1750821502601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo_activity" DROP COLUMN "content"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity"
            ADD "content" jsonb NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo_activity" DROP COLUMN "content"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity"
            ADD "content" character varying NOT NULL
        `)
    }
}
