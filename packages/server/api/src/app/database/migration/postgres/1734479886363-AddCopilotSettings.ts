import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCopilotSettings1734479886363 implements MigrationInterface {
    name = 'AddCopilotSettings1734479886363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "copilotSettings" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "copilotSettings"
        `)
    }

}
