import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatModeToChatConversation1807000000000 implements Migration {
    name = 'AddChatModeToChatConversation1807000000000'
    breaking = false
    release = '0.85.5'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN IF NOT EXISTS "chatMode" character varying NOT NULL DEFAULT 'NORMAL'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "chat_conversation" DROP COLUMN IF EXISTS "chatMode"')
    }
}
