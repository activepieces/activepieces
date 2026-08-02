import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { agentController } from './agent-controller'
import { agentVisibilityGuard } from './agent-visibility-helper'

const LEGACY_CHAT_PREFIX = '/v1/chat'

export const agentModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', agentVisibilityGuard)
    await app.register(agentController, { prefix: '/v1/agents' })
    await app.register(agentController, { prefix: LEGACY_CHAT_PREFIX })
}
