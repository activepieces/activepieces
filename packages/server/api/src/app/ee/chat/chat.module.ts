import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { chatController } from './chat-controller'
import { chatEvalController } from './chat-eval-controller'

export const chatModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.chatEnabled))
    await app.register(chatEvalController, { prefix: '/v1/chat' })
    await app.register(chatController, { prefix: '/v1/chat' })
}
