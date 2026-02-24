import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { projectMustBeTeamType } from '../authentication/ee-authorization'
import { alertsController } from './alerts-controller'

export const alertsModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.addHook('preHandler', projectMustBeTeamType)
    await app.register(alertsController, { prefix: '/v1/alerts' })
}