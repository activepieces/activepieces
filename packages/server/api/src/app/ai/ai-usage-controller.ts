import { ReportAiUsageRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { aiUsageService } from './ai-usage-service'

export const aiUsageController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', ReportAiUsage, async (request, reply) => {
        rejectedPromiseHandler(aiUsageService(app.log).reportManagedCall({
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            ...request.body,
        }), app.log)
        return reply.status(StatusCodes.ACCEPTED).send()
    })
}

const ReportAiUsage = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: ReportAiUsageRequest,
    },
}
