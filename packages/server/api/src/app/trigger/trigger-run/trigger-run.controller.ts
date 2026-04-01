import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { redisConnections } from '../../database/redis-connections'
import { triggerRunStats } from './trigger-run-stats'

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