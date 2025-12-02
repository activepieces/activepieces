import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformTemplateController } from './platform-template.controller'

export const platformTemplateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformTemplateController, { prefix: '/v1/templates/custom' })

    // Deprecated: This controller will be removed on 1/1/2026 but we keep it for backward compatibility.
    await app.register(platformTemplateController, { prefix: '/v1/flow-templates' })
}