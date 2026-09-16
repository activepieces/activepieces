import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAgentConversationAiCredits1850000000000 implements Migration {
    name = 'AddAgentConversationAiCredits1850000000000'
    breaking = false
    release = '0.91.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            ADD COLUMN IF NOT EXISTS "aiCredits" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            DROP COLUMN IF EXISTS "aiCredits"
        `)
    }
}
