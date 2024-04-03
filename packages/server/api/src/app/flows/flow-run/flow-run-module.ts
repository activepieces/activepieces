import { FastifyPluginAsync } from 'fastify'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { flowResponseWatcher } from './flow-response-watcher'
import { flowRunController as controller } from './flow-run-controller'

export const flowRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(controller, { prefix: '/v1/flow-runs' })
    await flowResponseWatcher.init()
}
