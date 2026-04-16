import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { templateController } from './template.controller'
import { templateTelemetryController } from './template-telemetry/template-telemetry.controller'

export const templateModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(templateController, { prefix: '/v1/templates' })
    await app.register(templateTelemetryController, { prefix: '/v1/templates-telemetry' })
}
