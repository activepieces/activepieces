import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { sdkController } from './sdk.controller'

export const sdkModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.headlessSdkEnabled))
    await app.register(sdkController, { prefix: '/v1/sdk' })
}
