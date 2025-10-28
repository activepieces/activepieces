import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeTodoActivityContentFormat1750354589729 implements MigrationInterface {
    name = 'ChangeTodoActivityContentFormat1750354589729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo"
                RENAME COLUMN "description" TO "content"
        `)
        await queryRunner.query(`
            DELETE FROM "todo_activity"
        `)
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
        await queryRunner.query(`
            ALTER TABLE "todo"
                RENAME COLUMN "content" TO "description"
        `)
    }

}
