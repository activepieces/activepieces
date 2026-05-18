import { ActivepiecesError, AnalyticsReportRequest, ErrorCode, LeaderboardRequest, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { platformMustHaveFeatureEnabled } from '../ee/authentication/ee-authorization'
import { userIdentityHelper } from '../helper/user-identity-helper'
import { piecesAnalyticsService } from './pieces-analytics.service'
import { platformAnalyticsReportService } from './platform-analytics-report.service'

export const platformAnalyticsModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.analyticsEnabled))
    await piecesAnalyticsService(app.log).init()
    await app.register(platformAnalyticsController, { prefix: '/v1/analytics' })
}

const platformAnalyticsController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', PlatformAnalyticsRequest, async (request) => {
        const { platform, id } = request.principal
        await assertUserIsNotEmbedded(id, request.log)
        const { timePeriod } = request.query
        return platformAnalyticsReportService(request.log).getOrGenerateReport(platform.id, timePeriod)
    })

    app.post('/refresh', RefreshPlatformAnalyticsRequest, async (request) => {
        const { platform, id } = request.principal
        await assertUserIsNotEmbedded(id, request.log)
        return platformAnalyticsReportService(request.log).refreshReport(platform.id)
    })

    app.get('/project-leaderboard', ProjectLeaderboardRequest, async (request) => {
        const { platform, id } = request.principal
        await assertUserIsNotEmbedded(id, request.log)
        const { timePeriod } = request.query
        return platformAnalyticsReportService(request.log).getProjectLeaderboard(platform.id, timePeriod)
    })

    app.get('/user-leaderboard', UserLeaderboardRequest, async (request) => {
        const { platform, id } = request.principal
        await assertUserIsNotEmbedded(id, request.log)
        const { timePeriod } = request.query
        return platformAnalyticsReportService(request.log).getUserLeaderboard(platform.id, timePeriod)
    })

    app.post('/mark-outdated', MarkAsOutdatedRequest, async (request) => {
        const { platform, id } = request.principal
        await assertUserIsNotEmbedded(id, request.log)
        await platformAnalyticsReportService(request.log).markAsOutdated(platform.id)
    })

}

async function assertUserIsNotEmbedded(userId: string, log: FastifyBaseLogger): Promise<void> {
    const isEmbedded = await userIdentityHelper(log).isUserEmbedded(userId)
    if (isEmbedded) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: { message: 'User is not allowed to access this resource' },
        })
    }
}

const RefreshPlatformAnalyticsRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}

const PlatformAnalyticsRequest = {
    schema: {
        querystring: AnalyticsReportRequest,
    },
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}

const ProjectLeaderboardRequest = {
    schema: {
        querystring: LeaderboardRequest,
    },
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}

const UserLeaderboardRequest = {
    schema: {
        querystring: LeaderboardRequest,
    },
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}

const MarkAsOutdatedRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}