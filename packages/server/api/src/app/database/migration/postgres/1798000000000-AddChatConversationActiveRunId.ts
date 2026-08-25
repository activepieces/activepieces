import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatConversationActiveRunId1798000000000 implements Migration {
    name = 'AddChatConversationActiveRunId1798000000000'
    breaking = false
    release = '0.85.4'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN "activeRunId" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP COLUMN IF EXISTS "activeRunId"
        `)
    }
}
