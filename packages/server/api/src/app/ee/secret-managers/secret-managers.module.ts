import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { secretManagersController } from './secret-managers.controller'

export const secretManagersModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.secretManagersEnabled))
    await app.register(secretManagersController, { prefix: '/v1/secret-managers' })
}
