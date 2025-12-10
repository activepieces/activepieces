import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { mcpServerController } from './mcp-server-controller'

export const mcpServerModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(mcpServerController, { prefix: '/v1/projects/:projectId/mcp-server' })

}
