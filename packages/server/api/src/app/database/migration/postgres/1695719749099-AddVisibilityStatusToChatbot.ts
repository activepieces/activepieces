import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddVisibilityStatusToChatbot1695719749099
implements MigrationInterface {
    name = 'AddVisibilityStatusToChatbot1695719749099'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "chatbot" ADD "visibilityStatus" character varying NOT NULL DEFAULT \'PRIVATE\'',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "chatbot" DROP COLUMN "visibilityStatus"',
        )
    }
}
