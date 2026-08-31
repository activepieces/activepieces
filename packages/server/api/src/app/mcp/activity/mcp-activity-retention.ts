import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { executionDataRetention } from '../../helper/retention/execution-data-retention'
import { McpActivityEntity } from './mcp-activity.entity'

const activityRepo = repoFactory(McpActivityEntity)

export const mcpActivityRetention = (log: FastifyBaseLogger) => ({
    async deleteStale(): Promise<void> {
        await executionDataRetention.sweep({
            repo: activityRepo,
            alias: 'activity',
            label: 'mcpActivityRetention',
            log,
        })
    },
})
