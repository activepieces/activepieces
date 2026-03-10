import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { openapiController } from './openapi.controller'

export const openapiModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(openapiController, { prefix: '/v1/docs' })
}
