import { PrincipalType, QueueMetricsResponse, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { queueMetricService } from './queue-metrics.service'
import { platformAdminOnly } from '@activepieces/server-shared'

export const queueMetricsController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', GetMetrics, async (request) => queueMetricService(request.log).getMetrics())
}

const GetMetrics = {
    schema: {
        tags: ['queue-metrics'],
        description: 'Get metrics',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: QueueMetricsResponse,
        },
    },
    config: {
        security: platformAdminOnly([PrincipalType.SERVICE, PrincipalType.USER]),
    },
}

