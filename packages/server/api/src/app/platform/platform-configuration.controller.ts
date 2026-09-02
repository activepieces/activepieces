import { PlatformConfiguration, PrincipalType, UpdatePlatformConfigurationRequestBody } from '@activepieces/shared'
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
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: UpdatePlatformConfigurationRequestBody,
        response: {
            [StatusCodes.OK]: PlatformConfiguration,
        },
    },
}
