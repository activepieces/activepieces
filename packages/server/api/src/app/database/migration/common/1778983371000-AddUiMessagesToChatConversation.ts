import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddUiMessagesToChatConversation1778983371000 implements Migration {
    name = 'AddUiMessagesToChatConversation1778983371000'
    breaking = false
    release = '0.83.0'
    transaction = true

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
