import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { mcpToolController } from './mcp-tools/mcp-tool-controller'
import { mcpServerController } from './mcp-server/mcp-server-controller'
import { mcpSessionManager } from './mcp-server/mcp-session-manager'
import { mcpSseController } from './mcp-server/mcp-sse-controller'

export const mcpModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(mcpServerController, { prefix: '/v1/mcp-servers' })
    await app.register(mcpSseController, { prefix: '/v1/mcp' })
    await app.register(mcpToolController, { prefix: '/v1/mcp-tools' })
    await mcpSessionManager(app.log).init()
}
