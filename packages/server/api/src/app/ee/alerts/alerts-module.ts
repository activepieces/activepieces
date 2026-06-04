import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { alertsController } from './alerts-controller'

export const alertsModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(alertsController, { prefix: '/v1/alerts' })
}