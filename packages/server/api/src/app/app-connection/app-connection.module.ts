import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { appConnectionWorkerController } from './app-connection-worker-controller'
import { appConnectionController } from './app-connection.controller'

export const appConnectionModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(appConnectionController, {
        prefix: '/v1/app-connections',
    })
    await app.register(appConnectionWorkerController, {
        prefix: '/v1/worker/app-connections',
    })
}
