import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { chatController } from './chat-controller'
import { chatEvalController } from './chat-eval-controller'

export const chatModule: FastifyPluginAsyncZod = async (app) => {
    // chatEnabled gates the whole module. The eval/playground routes additionally
    // require chatPlaygroundEnabled (gated inside chatEvalController). The chatEnabled
    // prerequisite is intentional: /eval/simulate runs the real chat agent loop, so a
    // platform that can't run chat can't evaluate it either.
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.chatEnabled))
    await app.register(chatEvalController, { prefix: '/v1/chat' })
    await app.register(chatController, { prefix: '/v1/chat' })
}
