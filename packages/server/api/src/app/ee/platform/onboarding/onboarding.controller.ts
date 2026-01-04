import { PlatformOnboarding } from '@activepieces/ee-shared'
import { securityAccess } from '@activepieces/server-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { onboardingService } from './onboarding.service'

export const onboardingController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/', GetOnboardingRequest, async (request) => {
        return onboardingService(request.log).getOnboarding(request.principal.platform.id)
    })
}

const GetOnboardingRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: PlatformOnboarding,
        },
    },
}
