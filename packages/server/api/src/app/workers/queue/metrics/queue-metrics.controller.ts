import { securityAccess } from '@activepieces/server-common'
import { PrincipalType, QueueMetricsResponse, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { queueMetricService } from './queue-metrics.service'

export const queueMetricsController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', GetMetrics, async (request) => queueMetricService(request.log).getMetrics())
}

const GetMetrics = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.SERVICE, PrincipalType.USER]),
    },
    schema: {
        tags: ['queue-metrics'],
        description: 'Get metrics',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: QueueMetricsResponse,
        },
    },
}

