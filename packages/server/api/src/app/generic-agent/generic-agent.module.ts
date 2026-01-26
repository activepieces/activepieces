import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { genericAgentController } from './generic-agent.controller'

export const genericAgentModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(genericAgentController, { prefix: '/v1/generic-agent' })
}

