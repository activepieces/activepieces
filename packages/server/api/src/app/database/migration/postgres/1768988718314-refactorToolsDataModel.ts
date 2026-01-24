import { MigrationInterface, QueryRunner } from 'typeorm'

export class RefactorToolsDataModel1768988718314 implements MigrationInterface {
    name = 'RefactorToolsDataModel1768988718314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_session"
                RENAME COLUMN "webSearchEnabled" TO "tools"
        `)
        await queryRunner.query(`
            ALTER TABLE "chat_session" DROP COLUMN "tools"
        `)
        await queryRunner.query(`
            ALTER TABLE "chat_session"
            ADD "tools" jsonb NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_session" DROP COLUMN "tools"
        `)
        await queryRunner.query(`
            ALTER TABLE "chat_session"
            ADD "tools" boolean NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "chat_session"
                RENAME COLUMN "tools" TO "webSearchEnabled"
        `)
    }

}
