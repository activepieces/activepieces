import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'
import { migrationHelpers } from '../../migration-helpers'

export class AddFlowAwarenessToAgentConversation1868000000000 implements Migration {
    name = 'AddFlowAwarenessToAgentConversation1868000000000'
    breaking = false
    release = '0.93.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            ADD COLUMN IF NOT EXISTS "flowId" character varying(21),
            ADD COLUMN IF NOT EXISTS "flowSnapshots" jsonb
        `)
        await migrationHelpers.createIndexConcurrently({
            queryRunner,
            name: 'idx_agent_conversation_project_flow_created',
            table: 'agent_conversation',
            columns: '"projectId", "flowId", "created"',
            where: '"flowId" IS NOT NULL',
        })
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await migrationHelpers.dropIndexConcurrently({
            queryRunner,
            name: 'idx_agent_conversation_project_flow_created',
        })
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            DROP COLUMN IF EXISTS "flowSnapshots",
            DROP COLUMN IF EXISTS "flowId"
        `)
    }
}
