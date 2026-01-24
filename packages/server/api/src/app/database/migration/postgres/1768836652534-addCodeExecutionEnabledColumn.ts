import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCodeExecutionEnabledColumn1768836652534 implements MigrationInterface {
    name = 'AddCodeExecutionEnabledColumn1768836652534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            TRUNCATE TABLE "chat_session"
        `)
        await queryRunner.query(`
            ALTER TABLE "chat_session"
            ADD "codeExecutionEnabled" boolean NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_session" DROP COLUMN "codeExecutionEnabled"
        `)
    }

}

