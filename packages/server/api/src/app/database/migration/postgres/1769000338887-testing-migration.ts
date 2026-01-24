import { MigrationInterface, QueryRunner } from "typeorm";

export class TestingMigration1769000338887 implements MigrationInterface {
    name = 'TestingMigration1769000338887'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_session" DROP COLUMN "codeExecutionEnabled"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_session"
            ADD "codeExecutionEnabled" boolean NOT NULL
        `);
    }

}
