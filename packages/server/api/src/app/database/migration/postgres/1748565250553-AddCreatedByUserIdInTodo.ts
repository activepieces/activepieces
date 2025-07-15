import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCreatedByUserIdInTodo1748565250553 implements MigrationInterface {
    name = 'AddCreatedByUserIdInTodo1748565250553'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD "createdByUserId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "FK_c79681af2867d6f762d94b885a9" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "FK_c79681af2867d6f762d94b885a9"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo" DROP COLUMN "createdByUserId"
        `)
    }

}
