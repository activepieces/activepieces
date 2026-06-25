import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { aiToolConfigController } from './ai-tool-config-controller'

export const aiToolConfigModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(aiToolConfigController, { prefix: '/v1/ai-tools' })
}
