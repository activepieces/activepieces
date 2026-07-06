import { PlatformPieceFilter, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdatePlatformPieceFilterRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { platformService } from './platform.service'

export const platformPieceFilterController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', GetPlatformPieceFilterRequest, async (req) => {
        return platformService(req.log).getPieceFilter(req.principal.platform.id)
    })

    app.post('/', UpdatePlatformPieceFilterRequest, async (req) => {
        return platformService(req.log).updatePieceFilter({
            id: req.principal.platform.id,
            ...req.body,
        })
    })
}

const GetPlatformPieceFilterRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['platform-piece-filter'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Get the platform-wide piece/component visibility killswitch',
        response: {
            [StatusCodes.OK]: PlatformPieceFilter,
        },
    },
}

const UpdatePlatformPieceFilterRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['platform-piece-filter'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Update the platform-wide piece/component visibility killswitch',
        body: UpdatePlatformPieceFilterRequestBody,
        response: {
            [StatusCodes.OK]: PlatformPieceFilter,
        },
    },
}
