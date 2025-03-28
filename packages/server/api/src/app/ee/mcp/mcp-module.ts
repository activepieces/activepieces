import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { mcpController } from './mcp-controller'

export const mcpModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(mcpController, { prefix: '/v1/mcp' })
}
