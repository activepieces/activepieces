import { securityAccess } from '@activepieces/server-shared'
import { ApEdition, TemplateTelemetryEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../helper/system/system'
import { templateTelemetryService } from './template-telemetry.service'

const edition = system.getEdition()

export const templateTelemetryController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/event', SendEventParams, async (request, reply) => {
        if (edition !== ApEdition.CLOUD) {
            return reply.status(StatusCodes.OK).send()
        }
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

