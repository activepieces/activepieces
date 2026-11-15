import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAgentConversationFlowRunId1843000000000 implements Migration {
    name = 'AddAgentConversationFlowRunId1843000000000'
    breaking = false
    release = '0.91.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            ADD COLUMN IF NOT EXISTS "flowRunId" character varying(21)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            DROP COLUMN IF EXISTS "flowRunId"
        `)
    }
}
