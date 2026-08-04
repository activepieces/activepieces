import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { agentController } from './agent-controller'
import { agentRunController } from './agent-run-controller'
import { chatVisibilityGuard } from './chat-visibility-helper'

export const agentModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(async (chatSurface) => {
        chatSurface.addHook('preHandler', chatVisibilityGuard)
        await chatSurface.register(agentController, { prefix: '/v1/agents' })
    })
    await app.register(agentRunController, { prefix: '/v1/agents' })
}
