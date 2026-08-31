import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddAgentIdsGinIndexToFlowVersion1839000000000 implements Migration {
    name = 'AddAgentIdsGinIndexToFlowVersion1839000000000'
    breaking = false
    release = '0.89.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_flow_version_agent_ids_gin"
                ON "flow_version" USING gin ("agentIds")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_flow_version_agent_ids_gin"
                ON "flow_version" USING gin ("agentIds")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_version_agent_ids_gin"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
