import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { mcpServerController } from './mcp-server-controller'

export const mcpServerModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(mcpServerController, { prefix: '/v1/projects/:projectId/mcp-server' })

}
