import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { templateController } from './template.controller'
import { deprecatedFlowTemplateController } from './deprecated-flow-template.controller'

export const templateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(templateController, { prefix: '/v1/templates' })
    await app.register(deprecatedFlowTemplateController, { prefix: '/v1/flow-templates' })
}