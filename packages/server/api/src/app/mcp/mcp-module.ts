import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { mcpPieceController } from './mcp-tools/mcp-piece-controller'
import { mcpServerController } from './mcp-server/mcp-server-controller'
import { mcpSessionManager } from './mcp-server/mcp-session-manager'
import { mcpSseController } from './mcp-server/mcp-sse-controller'

export const mcpModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(mcpServerController, { prefix: '/v1/mcp-servers' })
    await app.register(mcpSseController, { prefix: '/v1/mcp' })
    await app.register(mcpPieceController, { prefix: '/v1/mcp-pieces' })
    await mcpSessionManager(app.log).init()
}
