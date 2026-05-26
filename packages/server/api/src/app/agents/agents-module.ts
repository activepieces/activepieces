import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { agentToolsController } from './agent-tools-controller'

export const agentsModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(agentToolsController, { prefix: '/v1/projects/:projectId/agent-tools' })
}
