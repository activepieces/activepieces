import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { mcpServerController, mcpStreamableController } from './mcp-server-controller'

export const mcpServerModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(mcpStreamableController, { prefix: '/v1/mcp' })
    await app.register(mcpServerController, { prefix: '/v1/mcp-server' })

}
