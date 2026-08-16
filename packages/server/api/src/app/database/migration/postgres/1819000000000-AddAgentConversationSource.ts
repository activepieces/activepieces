import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAgentConversationSource1819000000000 implements Migration {
    name = 'AddAgentConversationSource1819000000000'
    breaking = false
    release = '0.87.1'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN IF NOT EXISTS "source" character varying NOT NULL DEFAULT 'CHAT'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "chat_conversation" DROP COLUMN IF EXISTS "source"')
    }
}
