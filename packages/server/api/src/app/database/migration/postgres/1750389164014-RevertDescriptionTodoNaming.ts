import { MigrationInterface, QueryRunner } from 'typeorm'

export class RevertDescriptionTodoNaming1750389164014 implements MigrationInterface {
    name = 'RevertDescriptionTodoNaming1750389164014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        
        await queryRunner.query(`
            ALTER TABLE "todo"
                RENAME COLUMN "content" TO "description"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo"
                RENAME COLUMN "description" TO "content"
        `)
    }

}
