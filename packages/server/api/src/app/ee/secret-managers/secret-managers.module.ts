import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { secretManagersController } from './secret-managers.controller'

export const secretManagersModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.secretManagersEnabled))
    await app.register(secretManagersController, { prefix: '/v1/secret-managers' })
}
