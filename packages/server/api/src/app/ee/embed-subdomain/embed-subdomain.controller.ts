import { EmbedSubdomain, GenerateEmbedSubdomainRequest, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { embedSubdomainService } from './embed-subdomain.service'

export const embedSubdomainController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', UpsertSubdomainEndpoint, async (request) => {
        return embedSubdomainService(request.log).upsert({
            platformId: request.principal.platform.id,
            hostname: request.body.hostname,
        })
    })

    app.get('/', GetSubdomainEndpoint, async (request) => {
        return embedSubdomainService(request.log).checkAndUpdateStatus({
            platformId: request.principal.platform.id,
        })
    })
}

const UpsertSubdomainEndpoint = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: GenerateEmbedSubdomainRequest,
        response: {
            [StatusCodes.OK]: EmbedSubdomain,
        },
    },
}

const GetSubdomainEndpoint = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: EmbedSubdomain.nullable(),
        },
    },
}
