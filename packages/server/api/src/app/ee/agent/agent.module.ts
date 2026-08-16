import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { agentController } from './agent-controller'
import { agentConversationController } from './agent-conversation-controller'
import { agentRunController } from './agent-run-controller'
import { chatVisibilityGuard } from './chat-visibility-helper'

export const agentModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(async (chatSurface) => {
        chatSurface.addHook('preHandler', chatVisibilityGuard)
        await chatSurface.register(agentConversationController, { prefix: '/v1/agents' })
    })
    await app.register(async (agentSurface) => {
        agentSurface.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.agentsEnabled))
        await agentSurface.register(agentController, { prefix: '/v1/agents' })
    })
    await app.register(agentRunController, { prefix: '/v1/agents' })
}
