import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { mcpPieceController } from './mcp-piece-controller'
import { mcpServerController } from './mcp-server-controller'
import { mcpSseController } from './mcp-sse-controller'

export const mcpModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(mcpServerController, { prefix: '/v1/mcp-servers' })
    await app.register(mcpSseController, { prefix: '/v1/mcp' })
    await app.register(mcpPieceController, { prefix: '/v1/mcp-pieces' })
}
