import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../ee/authentication/ee-authorization'
import { chatController } from './chat-controller'

export const chatModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.chatEnabled))
    await app.register(chatController, { prefix: '/v1/chat' })
}
