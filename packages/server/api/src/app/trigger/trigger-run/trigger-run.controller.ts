import { securityAccess, triggerRunStats } from '@activepieces/server-common'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { redisConnections } from '../../database/redis-connections'

export const triggerRunController: FastifyPluginAsyncZod = async (app) => {
    app.get('/status', GetStatusReportSchema, async (request) => {
        const platformId = request.principal.platform.id
        return triggerRunStats(app.log, await redisConnections.useExisting()).getStatusReport({ platformId })
    })
}

const GetStatusReportSchema = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}