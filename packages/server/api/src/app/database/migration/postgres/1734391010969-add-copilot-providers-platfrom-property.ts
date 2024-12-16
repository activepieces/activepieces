import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCopilotProvidersPlatfromProperty1734391010969 implements MigrationInterface {
    name = 'AddCopilotProvidersPlatfromProperty1734391010969'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "copilotSettings" jsonb
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "copilotSettings"
        `);
    }

}
