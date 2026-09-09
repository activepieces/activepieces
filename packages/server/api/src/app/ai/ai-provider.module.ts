import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { aiExecuteController } from './ai-execute-controller'
import { aiProviderController } from './ai-provider-controller'

export const aiProviderModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(aiProviderController, { prefix: '/v1/ai-providers' })
    await app.register(aiExecuteController, { prefix: '/v1/ai' })
}
