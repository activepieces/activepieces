import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSearchEnabledColumn1768836652533 implements MigrationInterface {
    name = 'AddSearchEnabledColumn1768836652533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_session"
            ADD "webSearchEnabled" boolean NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_session" DROP COLUMN "webSearchEnabled"
        `)
    }

}
