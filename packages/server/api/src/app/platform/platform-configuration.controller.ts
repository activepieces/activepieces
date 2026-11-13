import { PlatformConfiguration, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdatePlatformConfigurationRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { platformConfigurationService } from './platform-configuration.service'

export const platformConfigurationController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', GetPlatformConfigurationEndpoint, async (request) => {
        return platformConfigurationService(request.log).getOrCreateForPlatform({
            platformId: request.principal.platform.id,
        })
    })

    app.post('/', UpdatePlatformConfigurationEndpoint, async (request) => {
        return platformConfigurationService(request.log).update({
            platformId: request.principal.platform.id,
            isProductTelemetryEnabled: request.body.isProductTelemetryEnabled,
            isInfraSetupTelemetryEnabled: request.body.isInfraSetupTelemetryEnabled,
            maxBarrierSignals: request.body.maxBarrierSignals,
            aiSpecificModelsVisible: request.body.aiSpecificModelsVisible,
            defaultChatModel: request.body.defaultChatModel,
        })
    })
}

const GetPlatformConfigurationEndpoint = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: PlatformConfiguration,
        },
    },
}

const UpdatePlatformConfigurationEndpoint = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['platform-configuration'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Update platform settings, including the default chat model and whether specific AI models are visible to builders.',
        body: UpdatePlatformConfigurationRequestBody,
        response: {
            [StatusCodes.OK]: PlatformConfiguration,
        },
    },
}
