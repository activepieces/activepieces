import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAgentConversationWaitpointId1876000000000 implements Migration {
    name = 'AddAgentConversationWaitpointId1876000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            ADD COLUMN IF NOT EXISTS "waitpointId" character varying(21)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            DROP COLUMN IF EXISTS "waitpointId"
        `)
    }
}
