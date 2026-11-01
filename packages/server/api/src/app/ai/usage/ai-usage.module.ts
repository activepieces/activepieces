import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { aiUsageController } from './ai-usage.controller'

export const aiUsageModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(aiUsageController, { prefix: '/v1/ai-usage' })
}
