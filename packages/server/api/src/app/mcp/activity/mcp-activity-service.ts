import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { executionDataRetention } from '../../helper/retention/execution-data-retention'
import { MCP_ACTIVITY_ALIAS, McpActivityEntity } from './mcp-activity-entity'

const repo = repoFactory(McpActivityEntity)

export const mcpActivityService = (log: FastifyBaseLogger) => ({
    async deleteStale(): Promise<void> {
        await executionDataRetention.sweep({ repo, alias: MCP_ACTIVITY_ALIAS, logLabel: 'mcpActivityRetention', log })
    },
})
