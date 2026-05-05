import { GetSecurityAdvisoriesResponse, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { securityAdvisoryService } from './security-advisory.service'

export const securityAdvisoryModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(securityAdvisoryController, { prefix: '/v1/security-advisories' })
}

const securityAdvisoryController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', GetSecurityAdvisories, async (_request, reply) => {
        const response = await securityAdvisoryService(app.log).listForCurrentVersion()
        await reply.status(StatusCodes.OK).send(response)
    })
}

const GetSecurityAdvisories = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    response: {
        200: {
            description: 'Security advisories affecting the running version',
            type: GetSecurityAdvisoriesResponse,
        },
    },
}
