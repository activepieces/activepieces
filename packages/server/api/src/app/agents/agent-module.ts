import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { agentController } from './agent-controller'

export const agentModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(agentController, { prefix: '/v1/agents' })
}