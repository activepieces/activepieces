import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { agentController } from './agent-controller'
import { chatVisibilityGuard } from './chat-visibility-helper'

export const agentModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', chatVisibilityGuard)
    await app.register(agentController, { prefix: '/v1/agents' })
}
