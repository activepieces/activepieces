import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddDiscoveryBriefToChatConversation1795000000000 implements Migration {
    name = 'AddDiscoveryBriefToChatConversation1795000000000'
    breaking = false
    release = '0.85.2'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN "discoveryBrief" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP COLUMN IF EXISTS "discoveryBrief"
        `)
    }
}
