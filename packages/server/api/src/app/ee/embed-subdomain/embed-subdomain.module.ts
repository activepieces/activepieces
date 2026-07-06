import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { embedSubdomainController } from './embed-subdomain.controller'

export const embedSubdomainModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.embeddingEnabled))
    await app.register(embedSubdomainController, { prefix: '/v1/embed-subdomain' })
}
