import { ResolveCredentialGrantRequest, ResolveCredentialGrantResponse } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { credentialProxyGrantService } from './credential-proxy-grant.service'

export const credentialProxyController: FastifyPluginAsyncZod = async (app) => {
    app.post('/grants/resolve', ResolveGrantRequestOptions, async (request, reply) => {
        void reply.header('Cache-Control', 'no-store')
        return credentialProxyGrantService(request.log).resolve({ grantId: request.body.grantId })
    })
}

const ResolveGrantRequestOptions = {
    config: {
        security: securityAccess.credentialProxy(),
    },
    schema: {
        hide: true,
        body: ResolveCredentialGrantRequest,
        response: {
            [StatusCodes.OK]: ResolveCredentialGrantResponse,
        },
    },
}
