import { PrincipalType, UpdatePlatformReportRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../ee/authentication/ee-authorization'
import { piecesAnalyticsService } from './pieces-analytics.service'
import { platformAnalyticsReportService } from './platform-analytics-report.service'

export const platformAnalyticsModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.analyticsEnabled))
    await piecesAnalyticsService(app.log).init()
    await app.register(platformAnalyticsController, { prefix: '/v1/analytics' })
}

const platformAnalyticsController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', PlatformAnalyticsRequest, async (request) => {
        const { platform } = request.principal
        return platformAnalyticsReportService(request.log).getOrGenerateReport(platform.id)
    })

    app.post('/', UpdatePlatformReportRequestSchema, async (request) => {
        const { platform } = request.principal
        return platformAnalyticsReportService(request.log).update(platform.id, request.body)
    })

    app.post('/refresh', PlatformAnalyticsRequest, async (request) => {
        const { platform } = request.principal
        return platformAnalyticsReportService(request.log).refreshReport(platform.id)
    })
}

const UpdatePlatformReportRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
    schema: {
        body: UpdatePlatformReportRequest,
    },
}
const PlatformAnalyticsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
}