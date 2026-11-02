import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFlowSnapshotsToAgentConversation1879000000000 implements Migration {
    name = 'AddFlowSnapshotsToAgentConversation1879000000000'
    breaking = false
    release = '0.93.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            ADD COLUMN IF NOT EXISTS "flowSnapshots" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            DROP COLUMN IF EXISTS "flowSnapshots"
        `)
    }
}
