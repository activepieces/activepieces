import { EmbedSubdomain, GenerateEmbedSubdomainRequest, PrincipalType, UpdateEmbedSubdomainAllowedDomainsRequest } from '@activepieces/shared'
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

    app.post('/allowed-domains', UpdateAllowedDomainsEndpoint, async (request) => {
        return embedSubdomainService(request.log).updateAllowedDomains({
            platformId: request.principal.platform.id,
            allowedEmbedDomains: request.body.allowedEmbedDomains,
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

const UpdateAllowedDomainsEndpoint = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: UpdateEmbedSubdomainAllowedDomainsRequest,
        response: {
            [StatusCodes.OK]: EmbedSubdomain,
        },
    },
}
