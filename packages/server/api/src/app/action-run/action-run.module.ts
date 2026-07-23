import { FastifyPluginAsync } from 'fastify'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { actionRunController } from './action-run.controller'

export const actionRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(actionRunController, { prefix: '/v1/action-runs' })
}
