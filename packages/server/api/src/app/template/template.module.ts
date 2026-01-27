import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { templateTelemetryController } from './template-telemetry/template-telemetry.controller'
import { templateController } from './template.controller'

export const templateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(templateController, { prefix: '/v1/templates' })
    await app.register(templateTelemetryController, { prefix: '/v1/templates-telemetry' })
}