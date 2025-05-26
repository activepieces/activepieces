import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { mcpServerController } from './mcp-server/mcp-server-controller'
import { mcpSessionManager } from './mcp-server/mcp-session-manager'
import { mcpSseController } from './mcp-server/mcp-sse-controller'
import { mcpToolHistoryController } from './mcp-tools/mcp-tool-history/mcp-tool-history.controller'
import { mcpToolController } from './mcp-tools/mcp-tool.controller'

export const mcpModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(mcpServerController, { prefix: '/v1/mcp-servers' })
    await app.register(mcpSseController, { prefix: '/v1/mcp' })
    await app.register(mcpToolController, { prefix: '/v1/mcp-tools' })
    await app.register(mcpToolHistoryController, { prefix: '/v1/mcp-tools-history' })
    await mcpSessionManager(app.log).init()
}
