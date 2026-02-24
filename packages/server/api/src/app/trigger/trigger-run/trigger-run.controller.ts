import { securityAccess, triggerRunStats } from '@activepieces/server-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { redisConnections } from '../../database/redis-connections'

export const triggerRunController: FastifyPluginAsyncTypebox = async (app) => {
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