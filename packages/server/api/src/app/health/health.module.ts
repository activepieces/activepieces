import { DiagnosticsDelayQuery, DiagnosticsDelayResponse, GetDiagnosticsQuery, GetDiagnosticsResponse, GetSystemHealthChecksResponse, PlatformMetricsHealthHistory, PlatformMetricsLive, PlatformMetricsReport, PlatformMetricsReportRequest, PrincipalType } from '@activepieces/shared'
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
        const { createdAfter, createdBefore } = request.query
        return healthMetricsService(request.log).getQueueMetrics(platform.id, { createdAfter, createdBefore })
    })

    app.get('/history', GetHealthHistoryRequest, async (request) => {
        const { platform } = request.principal
        return healthMetricsService(request.log).getHealthHistory(platform.id)
    })

    app.get('/diagnostics', GetDiagnosticsRequest, async (request) => {
        return healthStatusService(app.log).getDiagnostics({
            platformId: request.principal.platform.id,
            includeRecentFailures: request.query.recentFailures === 'true',
        })
    })

    // In-deployment stand-in for a slow external API, used by `benchmark --with-http` so the
    // I/O-bound flow shape can be measured without a rate-limited public delay service. Holding
    // the connection costs no CPU (one timer), and the schema caps `seconds`, so a public route
    // can't be abused to pin connections indefinitely.
    app.get('/diagnostics/delay', DiagnosticsDelayRequest, async (request) => {
        const delaySeconds = request.query.seconds ?? DEFAULT_DELAY_SECONDS
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
        return { ok: true, delaySeconds }
    })
}

const GetSystemHealthChecks = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
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
        querystring: PlatformMetricsReportRequest,
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

const DEFAULT_DELAY_SECONDS = 1

const DiagnosticsDelayRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['health'],
        description: 'Responds after `seconds` (capped) — a stand-in for a slow external API, used by the benchmark\'s HTTP-piece flow',
        querystring: DiagnosticsDelayQuery,
        response: {
            200: DiagnosticsDelayResponse,
        },
    },
}

const GetDiagnosticsRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['health'],
        description: 'Server-measured infra round-trip latency (db/redis/storage) + effective config. Pass recentFailures=true to include the last 24h of failed production runs with their causes (opt-in: the scan is skipped for cheap polling).',
        querystring: GetDiagnosticsQuery,
        response: {
            200: GetDiagnosticsResponse,
        },
    },
}
