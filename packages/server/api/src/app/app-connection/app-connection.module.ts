import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { appConnectionController } from './app-connection.controller'
import { appConnectionWorkerController } from './app-connection-worker-controller'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'

export const appConnectionModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    await app.register(appConnectionController, {
        prefix: '/v1/app-connections',
    })
    await app.register(appConnectionWorkerController, {
        prefix: '/v1/worker/app-connections',
    })
}
