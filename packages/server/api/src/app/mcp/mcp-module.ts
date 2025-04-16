import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { mcpController } from './mcp-controller'
import { mcpPieceController } from './mcp-piece-controller'
import { mcpSessionManager } from './mcp-session-manager'
import { mcpSseController } from './mcp-sse-controller'

export const mcpModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(mcpController, { prefix: '/v1/mcp-servers' })
    await app.register(mcpSseController, { prefix: '/v1/mcp-servers' })
    await app.register(mcpPieceController, { prefix: '/v1/mcp-pieces' })
    await mcpSessionManager(app.log).init()
}
