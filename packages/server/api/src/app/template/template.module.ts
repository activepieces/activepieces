import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { templateTelemetryController } from './template-telemetry/template-telemetry.controller'
import { templateController } from './template.controller'

export const templateModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(templateController, { prefix: '/v1/templates' })
    await app.register(templateTelemetryController, { prefix: '/v1/templates-telemetry' })
}