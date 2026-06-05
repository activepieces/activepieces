import { GetSystemHealthChecksResponse, PlatformMetricsHealthHistory, PlatformMetricsLive, PlatformMetricsReport, PlatformMetricsReportRequest, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { healthMetricsService } from './health-metrics.service'
import { healthStatusService } from './health.service'

export const healthModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(healthController, { prefix: '/v1/health' })
}

const healthController: FastifyPluginAsyncZod = async (app) => {
    app.get(
        '/',
        {
            config: {
                security: securityAccess.public(),
            },
        },
        async (_request, reply) => {
            const isHealthy = await healthStatusService(app.log).isHealthy()
            if (!isHealthy) {
                await reply.status(StatusCodes.SERVICE_UNAVAILABLE).send({ status: 'Unhealthy' })
                return
            }
            await reply.status(StatusCodes.OK).send({ status: 'Healthy' })
        },
    ),
    app.get('/system', GetSystemHealthChecks, async (request, reply) => {
        await reply.status(StatusCodes.OK).send(await healthStatusService(app.log).getSystemHealthChecks(request.principal.platform.id))
    })

    app.get('/run-metrics', GetRunMetricsRequest, async (request) => {
        const { platform } = request.principal
        const { createdAfter, createdBefore } = request.query
        return healthMetricsService(request.log).getRunMetrics(platform.id, { createdAfter, createdBefore })
    })

    app.get('/queue-metrics', GetQueueMetricsRequest, async (request) => {
        const { platform } = request.principal
        return healthMetricsService(request.log).getQueueMetrics(platform.id)
    })

    app.get('/history', GetHealthHistoryRequest, async (request) => {
        const { platform } = request.principal
        return healthMetricsService(request.log).getHealthHistory(platform.id)
    })
}

const GetSystemHealthChecks = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    response: {
        200: {
            description: 'System health checks',
            type: GetSystemHealthChecksResponse,
        },
    },
}

const GetRunMetricsRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        tags: ['health'],
        querystring: PlatformMetricsReportRequest,
        response: {
            200: PlatformMetricsReport,
        },
    },
}

const GetQueueMetricsRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        tags: ['health'],
        response: {
            200: PlatformMetricsLive,
        },
    },
}

const GetHealthHistoryRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        tags: ['health'],
        response: {
            200: PlatformMetricsHealthHistory,
        },
    },
}
