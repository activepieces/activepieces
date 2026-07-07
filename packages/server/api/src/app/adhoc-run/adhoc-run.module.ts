import { FastifyPluginAsync } from 'fastify'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { adhocRunController } from './adhoc-run.controller'

export const adhocRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(adhocRunController, { prefix: '/v1/adhoc-runs' })
}
