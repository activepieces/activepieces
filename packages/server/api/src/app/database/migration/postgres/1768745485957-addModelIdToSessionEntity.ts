import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModelIdToSessionEntity1768745485957 implements MigrationInterface {
    name = 'AddModelIdToSessionEntity1768745485957'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_session"
            ADD "modelId" character varying NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_session" DROP COLUMN "modelId"
        `);
    }

}
