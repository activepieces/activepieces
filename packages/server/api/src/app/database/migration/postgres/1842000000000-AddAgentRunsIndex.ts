import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const INDEX_NAME = 'idx_agent_conversation_agent_runs_created_id'

export class AddAgentRunsIndex1842000000000 implements Migration {
    name = 'AddAgentRunsIndex1842000000000'
    breaking = false
    release = '0.91.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "${INDEX_NAME}"
                ON "agent_conversation" ("projectId", "agentId", "created", "id")
                WHERE "source" = 'FLOW_STEP' AND "agentId" IS NOT NULL
            `)
            return
        }
        const invalid = await queryRunner.query(`
            SELECT 1 FROM pg_class c
            JOIN pg_index i ON i.indexrelid = c.oid
            WHERE c.relname = '${INDEX_NAME}' AND NOT i.indisvalid
        `)
        if (invalid.length > 0) {
            await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${INDEX_NAME}"`)
        }
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "${INDEX_NAME}"
            ON "agent_conversation" ("projectId", "agentId", "created", "id")
            WHERE "source" = 'FLOW_STEP' AND "agentId" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "${INDEX_NAME}"`)
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
