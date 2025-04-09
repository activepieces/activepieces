import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { mcpController } from './mcp-controller'
import { mcpSessionManager } from './mcp-session-manager'
import { mcpSseController } from './mcp-sse-controller'

export const mcpModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(mcpController, { prefix: '/v1/mcp' })
    await app.register(mcpSseController, { prefix: '/v1/mcp' })
    await mcpSessionManager(app.log).init()
}
