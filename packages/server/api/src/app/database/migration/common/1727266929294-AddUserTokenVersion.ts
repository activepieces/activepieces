import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTokenVersion1727266929294 implements MigrationInterface {
    name = 'AddUserTokenVersion1727266929294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
                RENAME COLUMN "sessionId" TO "tokenVersion"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
                RENAME COLUMN "tokenVersion" TO "sessionId"
        `);
    }

}
