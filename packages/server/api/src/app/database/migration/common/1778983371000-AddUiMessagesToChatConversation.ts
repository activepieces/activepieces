import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUiMessagesToChatConversation1778983371000 implements MigrationInterface {
    name = 'AddUiMessagesToChatConversation1778983371000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation" ADD COLUMN IF NOT EXISTS "uiMessages" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation" DROP COLUMN "uiMessages"
        `)
    }

}
