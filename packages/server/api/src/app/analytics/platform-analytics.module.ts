import { securityAccess } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, PrincipalType, UpdatePlatformReportRequest, UserIdentityProvider } from '@activepieces/shared'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { platformMustHaveFeatureEnabled } from '../ee/authentication/ee-authorization'
import { userService } from '../user/user-service'
import { piecesAnalyticsService } from './pieces-analytics.service'
import { platformAnalyticsReportService } from './platform-analytics-report.service'

export const platformAnalyticsModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.analyticsEnabled))
    await piecesAnalyticsService(app.log).init()
    await app.register(platformAnalyticsController, { prefix: '/v1/analytics' })
}

const platformAnalyticsController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', PlatformAnalyticsRequest, async (request) => {
        const { platform, id } = request.principal
        await assertUserIsNotEmbedded(id, request.log)
        const timePeriod = request.query.timePeriod as 'weekly' | 'monthly' | '3-months' | 'all-time' | undefined
        return platformAnalyticsReportService(request.log).getOrGenerateReport(platform.id, timePeriod)
    })

    app.post('/refresh', RefreshPlatformAnalyticsRequest, async (request) => {
        const { platform, id } = request.principal
        await assertUserIsNotEmbedded(id, request.log)
        return platformAnalyticsReportService(request.log).refreshReport(platform.id)
    })

}

async function assertUserIsNotEmbedded(userId: string, log: FastifyBaseLogger): Promise<void> {
    const user = await userService.getOneOrFail({ id: userId })
    const userIdentity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
    if (userIdentity.provider === UserIdentityProvider.JWT) {
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
        querystring: Type.Object({
            timePeriod: Type.Optional(Type.Union([
                Type.Literal('weekly'),
                Type.Literal('monthly'),
                Type.Literal('3-months'),
                Type.Literal('all-time'),
            ])),
        }),
    },
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}