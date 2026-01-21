import { securityAccess } from '@activepieces/server-shared'
import { TemplateTelemetryEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { templateTelemetryService } from './template-telemetry.service'

export const templateTelemetryController: FastifyPluginAsyncTypebox = async (app) => {
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

