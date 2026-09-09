import { TemplateTelemetryEvent } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { platformUtils } from '../../platform/platform.utils'
import { templateTelemetryService } from './template-telemetry.service'

export const templateTelemetryController: FastifyPluginAsyncZod = async (app) => {
    app.post('/event', SendEventParams, async (request, reply) => {
        const platformId = await platformUtils.getPlatformIdForRequest(request)
        templateTelemetryService(app.log).sendEventForPlatform({ event: request.body, platformId })
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

