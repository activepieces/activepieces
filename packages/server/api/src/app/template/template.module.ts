import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { templateManagerController } from './template-manager/template-manager.controller'
import { templateController } from './template.controller'

export const templateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(templateController, { prefix: '/v1/templates' })
    await app.register(templateManagerController, { prefix: '/v1/templates-manager' })
}