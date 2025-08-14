import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { triggerRunService } from './trigger-run.service'

export const triggerRunController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/status', GetStatusReportSchema, async (request) => {
        const platformId = request.principal.platform.id
        return triggerRunService(request.log).getStatusReport({ platformId })
    })
}


const GetStatusReportSchema = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}