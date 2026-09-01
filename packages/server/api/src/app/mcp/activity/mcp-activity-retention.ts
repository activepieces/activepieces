import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { executionDataRetention } from '../../helper/retention/execution-data-retention'
import { ACTIVITY_ALIAS, McpActivityEntity } from './mcp-activity-entity'

const activityRepo = repoFactory(McpActivityEntity)

export const mcpActivityRetention = (log: FastifyBaseLogger) => ({
    async deleteStale(): Promise<void> {
        await executionDataRetention.sweep({
            repo: activityRepo,
            alias: ACTIVITY_ALIAS,
            logLabel: 'mcpActivityRetention',
            log,
        })
    },
})
