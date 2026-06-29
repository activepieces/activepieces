import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { connectController } from './connect.controller'

export const connectModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(connectController, { prefix: '/v1/connect' })
}
