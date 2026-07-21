import { EnginePrincipal, PrincipalType, ProjectAiCreditUsage, ReportAiCreditUsageRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { aiCreditUsageService } from './ai-credit-usage-service'

export const aiCreditUsageController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', ReportUsageRequest, async (request, reply) => {
        const enginePrincipal = request.principal as EnginePrincipal
        await aiCreditUsageService.record({
            platformId: enginePrincipal.platform.id,
            projectId: enginePrincipal.projectId,
            provider: request.body.provider,
            model: request.body.model,
            cost: request.body.cost,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.get('/', ListUsageRequest, async (request) => {
        return aiCreditUsageService.list({
            platformId: request.principal.platform.id,
        })
    })
}

const ReportUsageRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: ReportAiCreditUsageRequest,
    },
}

const ListUsageRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['ai-credit-usage'],
        description: 'List AI credit usage aggregated per project for the platform',
        response: {
            [StatusCodes.OK]: z.array(ProjectAiCreditUsage),
        },
    },
}
