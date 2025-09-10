import { FastifyPluginAsync } from 'fastify'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { engineResponseWatcher } from '../../workers/engine-response-watcher'
import { flowRunController } from './flow-run-controller'


export const flowRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(flowRunController, { prefix: '/v1/flow-runs' })
    await engineResponseWatcher(app.log).init()
}
