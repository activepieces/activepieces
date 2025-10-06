import { PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
import { queueMetricService } from './queue-metrics.service'

export const queueMetricsController: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)

    app.get('/', GetMetrics, async (request) => queueMetricService(request.log).getMetrics())
    app.post('/reset', ResetMetrics, async (request) => queueMetricService(request.log).resetMetrics())
}

const GetMetrics = {
    schema: {
        tags: ['queue-metrics'],
        description: 'Get metrics',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
    config: {
        allowedPrincipals: [PrincipalType.SERVICE, PrincipalType.USER],
    },
}

const ResetMetrics = {
    schema: {
        tags: ['queue-metrics'],
        description: 'Reset metrics',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
    config: {
        allowedPrincipals: [PrincipalType.SERVICE, PrincipalType.USER],
    },
}
