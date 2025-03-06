import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { templateController } from './template.controller'

export const templateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(templateController, {
        prefix: '/v1/templates',
    })
}
