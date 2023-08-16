import { FastifyPluginAsync } from 'fastify'
import { flowRunController as controller } from './flow-run-controller'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'

export const flowRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(controller, { prefix: '/v1/flow-runs' })
}
