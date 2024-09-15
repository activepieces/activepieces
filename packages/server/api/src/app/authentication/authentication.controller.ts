import { ApplicationEventName } from '@activepieces/ee-shared'
import { AppSystemProp, networkUtls, system } from '@activepieces/server-shared'
import {
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    SignInRequest,
    SignUpRequest,
} from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { eventsHooks } from '../helper/application-events'
import { resolvePlatformIdForAuthnRequest } from '../platform/platform-utils'
import { authenticationService } from './authentication-service'
import { Provider } from './authentication-service/hooks/authentication-service-hooks'

const edition = system.getEdition()

export const authenticationController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/sign-up', SignUpRequestOptions, async (request) => {
        const platformId = await resolvePlatformIdForAuthnRequest(request.body.email, request)

        const signUpResponse = await authenticationService.signUp({
            ...request.body,
            verified: edition === ApEdition.COMMUNITY,
            platformId,
            provider: Provider.EMAIL,
        })

        eventsHooks.get().sendUserEvent({
            platformId: platformId!,
            userId: signUpResponse.id,
            projectId: signUpResponse.projectId,
            ip: networkUtls.extractClientRealIp(request),
        }, {
            action: ApplicationEventName.USER_SIGNED_UP,
            data: {
                source: 'credentials',
            },
        })

        return signUpResponse
    })

    app.post('/sign-in', SignInRequestOptions, async (request) => {
        const platformId = await resolvePlatformIdForAuthnRequest(request.body.email, request)


        const response = await authenticationService.signIn({
            email: request.body.email,
            password: request.body.password,
            platformId,
            provider: Provider.EMAIL,
        })

        eventsHooks.get().sendUserEvent({
            platformId: platformId!,
            userId: response.id,
            projectId: response.projectId,
            ip: networkUtls.extractClientRealIp(request),
        }, {
            action: ApplicationEventName.USER_SIGNED_IN,
            data: {},
        })

        return response
    })
}

const rateLimitOptions: RateLimitOptions = {
    max: Number.parseInt(
        system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_MAX),
        10,
    ),
    timeWindow: system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
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
