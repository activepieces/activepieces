import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddAgentRunsIndex1842000000000 implements Migration {
    name = 'AddAgentRunsIndex1842000000000'
    breaking = false
    release = '0.91.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_agent_conversation_agent_runs_created_id"
            ON "agent_conversation" ("projectId", "agentId", "created", "id")
            WHERE source = 'FLOW_STEP' AND "agentId" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'
        await queryRunner.query(`
            DROP INDEX ${concurrently} IF EXISTS "idx_agent_conversation_agent_runs_created_id"
        `)
    }
}

function isPGlite(): boolean {
    return system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
}
