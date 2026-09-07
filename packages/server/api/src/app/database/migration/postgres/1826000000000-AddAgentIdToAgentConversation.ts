import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAgentIdToAgentConversation1826000000000 implements Migration {
    name = 'AddAgentIdToAgentConversation1826000000000'
    breaking = false
    release = '0.88.1'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            ADD "agentId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            ADD CONSTRAINT "fk_agent_conversation_agent_id"
            FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_agent_conversation_agent_user_created_id"
            ON "agent_conversation" ("agentId", "userId", "created", "id")
            WHERE "agentId" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_agent_conversation_agent_user_created_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            DROP CONSTRAINT "fk_agent_conversation_agent_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_conversation" DROP COLUMN "agentId"
        `)
    }
}
