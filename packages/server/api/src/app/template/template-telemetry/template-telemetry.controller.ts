import { TemplateTelemetryEvent } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { templateTelemetryService } from './template-telemetry.service'

export const templateTelemetryController: FastifyPluginAsyncZod = async (app) => {
    app.post('/event', SendEventParams, async (request, reply) => {
        templateTelemetryService(app.log).sendEvent(request.body)
        return reply.status(StatusCodes.OK).send()
    })
}

const SendEventParams = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: TemplateTelemetryEvent,
    },
}

