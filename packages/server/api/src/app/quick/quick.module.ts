import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { quickController } from './quick.controller'

export const quickModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(quickController, { prefix: '/v1/quick' })
}

