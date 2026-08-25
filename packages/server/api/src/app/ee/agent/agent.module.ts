import { agentVisibility } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { agentController } from './agent-controller'
import { agentConversationController } from './agent-conversation-controller'
import { agentRunController } from './agent-run-controller'
import { chatVisibilityGuard } from './chat-visibility-helper'
import { chatPersonalizationController } from './personalization/chat-personalization-controller'

export const agentModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(async (chatSurface) => {
        chatSurface.addHook('preHandler', chatVisibilityGuard)
        await chatSurface.register(agentConversationController, { prefix: '/v1/agents' })
        await chatSurface.register(chatPersonalizationController, { prefix: '/v1/agents/personalization' })
    })
    await app.register(async (agentSurface) => {
        agentSurface.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => agentVisibility.resolveAgentsEnabled({
            edition: system.getEdition(),
            releaseEnabled: system.getBoolean(AppSystemProp.AGENTS_ENABLED) === true,
            planAgentsEnabled: platform.plan.agentsEnabled,
        })))
        await agentSurface.register(agentController, { prefix: '/v1/agents' })
    })
    await app.register(agentRunController, { prefix: '/v1/agents' })
}
