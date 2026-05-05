import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { mcpPlatformController } from './mcp-platform-controller'
import { mcpServerController } from './mcp-server-controller'

export const mcpServerModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(mcpServerController, { prefix: '/v1/projects/:projectId/mcp-server' })
    await app.register(mcpPlatformController, { prefix: '/v1/mcp-server' })
}
