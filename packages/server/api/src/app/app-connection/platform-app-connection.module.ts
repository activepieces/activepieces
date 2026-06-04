import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformAppConnectionController } from './platform-app-connection.controller'

export const platformAppConnectionModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformAppConnectionController, {
        prefix: '/v1/platform-app-connections',
    })
}
