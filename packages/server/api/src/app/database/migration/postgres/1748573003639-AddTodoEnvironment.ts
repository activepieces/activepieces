import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTodoEnvironment1748573003639 implements MigrationInterface {
    name = 'AddTodoEnvironment1748573003639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD "environment" character varying
        `)

        await queryRunner.query(`
            UPDATE "todo"
            SET "environment" = 'PRODUCTION'
        `)

        await queryRunner.query(`
            ALTER TABLE "todo"
            ALTER COLUMN "environment" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo" DROP COLUMN "environment"
        `)
    }

}
