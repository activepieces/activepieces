import { isNil } from '@activepieces/core-utils'
import { ApplicationEventName, CompleteSignUpRequest, PrincipalType, SignInRequest, SignUpRequest, SwitchPlatformRequest, TelemetryEventName, UserIdentityProvider } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { authnRateLimit } from '../core/security/rate-limit'
import { applicationEvents } from '../helper/application-events'
import { networkUtils } from '../helper/network-utils'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { telemetry } from '../helper/telemetry.utils'
import { platformUtils } from '../platform/platform.utils'
import { userService } from '../user/user-service'
import { authenticationService } from './authentication.service'
import { turnstile } from './lib/turnstile'
import { passwordlessAuthService } from './passwordless-auth.service'

export const authenticationController: FastifyPluginAsyncZod = async (
    app,
) => {
    app.post('/sign-up', SignUpRequestOptions, async (request) => {

        const platformId = await platformUtils.getPlatformIdForRequest(request)
        await turnstile.assertSolved({
            token: request.body.captchaToken,
            remoteIp: clientIp(request),
            log: request.log,
        })
        const signUpResponse = await authenticationService(request.log).signUp({
            ...request.body,
            provider: UserIdentityProvider.EMAIL,
            platformId: platformId ?? null,
        })

        if (!isNil(signUpResponse.platformId)) {
            applicationEvents(request.log).sendUserEvent({
                platformId: signUpResponse.platformId,
                userId: signUpResponse.id,
                projectId: signUpResponse.projectId ?? undefined,
                ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
            }, {
                action: ApplicationEventName.USER_SIGNED_UP,
                data: {
                    source: 'credentials',
                },
            })
        }

        return signUpResponse
    })

    app.post('/sign-in', SignInRequestOptions, async (request) => {

        const predefinedPlatformId = await platformUtils.getPlatformIdForRequest(request)
        const response = await authenticationService(request.log).signInWithPassword({
            email: request.body.email,
            password: request.body.password,
            predefinedPlatformId,
        })

        if (!isNil(response.platformId)) {
            applicationEvents(request.log).sendUserEvent({
                platformId: response.platformId,
                userId: response.id,
                projectId: response.projectId ?? undefined,
                ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
            }, {
                action: ApplicationEventName.USER_SIGNED_IN,
                data: {},
            })
            rejectedPromiseHandler(telemetry(request.log).trackUser(response.id, {
                name: TelemetryEventName.SIGNED_IN,
                payload: {
                    userId: response.id,
                    platformId: response.platformId,
                },
            }, { platform: response.platformId }), request.log)
        }

        return response
    })

    app.post('/complete-sign-up', CompleteSignUpRequestOptions, async (request) => {
        const { response, signedUp } = await passwordlessAuthService(request.log).completeSignUp({
            identityId: request.principal.id,
            fullName: request.body.fullName,
        })

        if (signedUp && !isNil(response.platformId)) {
            applicationEvents(request.log).sendUserEvent({
                platformId: response.platformId,
                userId: response.id,
                projectId: response.projectId ?? undefined,
                ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
            }, {
                action: ApplicationEventName.USER_SIGNED_UP,
                data: {},
            })
        }

        return response
    })

    app.post('/switch-platform', SwitchPlatformRequestOptions, async (request) => {
        const user = await userService(request.log).getOneOrFail({ id: request.principal.id })
        return authenticationService(request.log).switchPlatform({
            identityId: user.identityId,
            platformId: request.body.platformId,
        })
    })

}



const SwitchPlatformRequestOptions = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
        rateLimit: authnRateLimit,
    },
    schema: {
        body: SwitchPlatformRequest,
    },
}

const SignUpRequestOptions = {
    config: {
        security: securityAccess.public(),
        rateLimit: authnRateLimit,
    },
    schema: {
        body: SignUpRequest,
    },
}

const CompleteSignUpRequestOptions = {
    config: {
        security: securityAccess.unscoped([PrincipalType.ONBOARDING]),
        rateLimit: authnRateLimit,
    },
    schema: {
        body: CompleteSignUpRequest,
    },
}

function clientIp(request: FastifyRequest): string {
    return networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER))
}

const SignInRequestOptions = {
    config: {
        security: securityAccess.public(),
        rateLimit: authnRateLimit,
    },
    schema: {
        body: SignInRequest,
    },
}
