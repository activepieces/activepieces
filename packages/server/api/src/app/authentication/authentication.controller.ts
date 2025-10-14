import { ApplicationEventName } from '@activepieces/ee-shared'
import { AppSystemProp, networkUtils } from '@activepieces/server-shared'
import {
    ALL_PRINCIPAL_TYPES,
    assertNotNullOrUndefined,
    PrincipalType,
    SignInRequest,
    SignUpRequest,
    SwitchPlatformRequest,
    SwitchProjectRequest,
    UserIdentityProvider,
} from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { eventsHooks } from '../helper/application-events'
import { system } from '../helper/system/system'
import { platformUtils } from '../platform/platform.utils'
import { userService } from '../user/user-service'
import { authenticationService } from './authentication.service'

export const authenticationController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/sign-up', SignUpRequestOptions, async (request) => {

        const platformId = await platformUtils.getPlatformIdForRequest(request)
        const signUpResponse = await authenticationService(request.log).signUp({
            ...request.body,
            provider: UserIdentityProvider.EMAIL,
            platformId: platformId ?? null,
        })

        eventsHooks.get(request.log).sendUserEvent({
            platformId: signUpResponse.platformId!,
            userId: signUpResponse.id,
            projectId: signUpResponse.projectId,
            ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_UP,
            data: {
                source: 'credentials',
            },
        })

        return signUpResponse
    })

    app.post('/sign-in', SignInRequestOptions, async (request) => {

        const predefinedPlatformId = await platformUtils.getPlatformIdForRequest(request)
        const response = await authenticationService(request.log).signInWithPassword({
            email: request.body.email,
            password: request.body.password,
            predefinedPlatformId,
        })

        const responsePlatformId = response.platformId
        assertNotNullOrUndefined(responsePlatformId, 'Platform ID is required')
        eventsHooks.get(request.log).sendUserEvent({
            platformId: responsePlatformId,
            userId: response.id,
            projectId: response.projectId,
            ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_IN,
            data: {},
        })

        return response
    })

    app.post('/switch-platform', SwitchPlatformRequestOptions, async (request) => {
        const user = await userService.getOneOrFail({ id: request.principal.id })
        return authenticationService(request.log).switchPlatform({
            identityId: user.identityId,
            platformId: request.body.platformId,
        })
    })

    app.post('/switch-project', SwitchProjectRequestOptions, async (request) => {
        const user = await userService.getOneOrFail({ id: request.principal.id })
        return authenticationService(request.log).switchProject({
            identityId: user.identityId,
            projectId: request.body.projectId,
            currentPlatformId: request.principal.platform.id,
        })
    })
}

const rateLimitOptions: RateLimitOptions = {
    max: Number.parseInt(
        system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_MAX),
        10,
    ),
    timeWindow: system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
}

const SwitchProjectRequestOptions = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SwitchProjectRequest,
    },
}

const SwitchPlatformRequestOptions = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SwitchPlatformRequest,
    },
}

const SignUpRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignUpRequest,
    },
}

const SignInRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignInRequest,
    },
}
