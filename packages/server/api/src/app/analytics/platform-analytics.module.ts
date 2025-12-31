import { securityAccess } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, PrincipalType, UpdatePlatformReportRequest, UserIdentityProvider } from '@activepieces/shared'
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
        return platformAnalyticsReportService(request.log).getOrGenerateReport(platform.id)
    })

    app.post('/', UpdatePlatformReportRequestSchema, async (request) => {
        const { platform, id } = request.principal
        await assertUserIsNotEmbedded(id, request.log)
        return platformAnalyticsReportService(request.log).update(platform.id, request.body)
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


const UpdatePlatformReportRequestSchema = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: UpdatePlatformReportRequest,
    },
}

const RefreshPlatformAnalyticsRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}

const PlatformAnalyticsRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}