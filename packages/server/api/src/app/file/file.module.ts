import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { fileController } from './file.controller'

export const fileModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(fileController, { prefix: '/v1/files' })
}
