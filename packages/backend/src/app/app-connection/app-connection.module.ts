import { FastifyPluginCallback } from 'fastify'
import { appConnectionController } from './app-connection.controller'
import { appConnectionWorkerController } from './app-connection-worker-controller'

export const appConnectionModule: FastifyPluginCallback = (app, _opts, done) => {
    app.register(appConnectionController, { prefix: '/v1/app-connections' })
    app.register(appConnectionWorkerController, { prefix: '/v1/worker/app-connections' })

    done()
}
