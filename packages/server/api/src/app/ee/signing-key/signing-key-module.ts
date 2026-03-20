import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { signingKeyController } from './signing-key-controller'

export const signingKeyModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.embeddingEnabled))
    await app.register(signingKeyController, { prefix: '/v1/signing-keys' })
}
