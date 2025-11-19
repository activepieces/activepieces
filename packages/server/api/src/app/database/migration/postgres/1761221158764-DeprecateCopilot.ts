import { MigrationInterface, QueryRunner } from 'typeorm'

export class DeprecateCopilot1761221158764 implements MigrationInterface {
    name = 'DeprecateCopilot1761221158764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "copilotSettings"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "copilotSettings" jsonb
        `)
    }

}
