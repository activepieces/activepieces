import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { alertsController } from './alerts-controller'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'

export const alertsModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.alertsEnabled))
    await app.register(alertsController, { prefix: '/v1/alerts' })
}