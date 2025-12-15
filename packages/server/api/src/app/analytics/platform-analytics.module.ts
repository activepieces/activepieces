import { FlowOperationType, PrincipalType, UpdatePlatformReportRequest, UpdateTimeSavedPerRunRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../ee/authentication/ee-authorization'
import { flowService } from '../flows/flow/flow.service'
import { projectService } from '../project/project-service'
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

    // TODO(@chaker): remove this endpoint after solving the issue with removing project id from the principal
    app.post('/time-saved-per-run', UpdateTimeSavedPerRunRequestSchema, async (request) => {
        const flow = await flowService(request.log).getOneById(request.body.flowId)
        if (!flow) {
            throw new Error('Flow not found')
        }
        const platformId = await projectService.getPlatformId(flow.projectId)
        if (platformId !== request.principal.platform.id) {
            throw new Error('Unauthorized')
        }
        return flowService(request.log).update({
            id: flow.id,
            projectId: flow.projectId,
            userId: request.principal.id,
            platformId: request.principal.platform.id,
            operation: {
                type: FlowOperationType.UPDATE_MINUTES_SAVED,
                request: { timeSavedPerRun: request.body.timeSavedPerRun ?? null },
            },
        })
    })
}

const UpdateTimeSavedPerRunRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
    schema: {
        body: UpdateTimeSavedPerRunRequest,
    },
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