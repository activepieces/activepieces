import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { openapiController } from './openapi.controller'

export const openapiModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(openapiController, { prefix: '/v1/docs' })
}
