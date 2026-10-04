import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformModelTierController } from './platform-model-tier-controller'

export const platformModelTierModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformModelTierController, { prefix: '/v1/platform-model-tiers' })
}
