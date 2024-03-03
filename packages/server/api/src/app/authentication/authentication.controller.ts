import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { RateLimitOptions } from '@fastify/rate-limit'
import { authenticationService } from './authentication-service'
import { resolvePlatformIdForRequest } from '../platform/platform-utils'
import { getEdition } from '../helper/secret-helper'
import {
    ApEdition,
    SignUpRequest,
    SignInRequest,
    ALL_PRINCIPAL_TYPES,
} from '@activepieces/shared'
import { system, SystemProp } from 'server-shared'
import { Provider } from './authentication-service/hooks/authentication-service-hooks'
import { eventsHooks } from '../helper/application-events'
import { ApplicationEventName } from '@activepieces/ee-shared'

const edition = getEdition()

export const authenticationController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/sign-up', SignUpRequestOptions, async (request) => {
        const platformId = await resolvePlatformIdForRequest(request)

        const signUpResponse = await authenticationService.signUp({
            ...request.body,
            verified: edition === ApEdition.COMMUNITY,
            platformId,
            provider: Provider.EMAIL,
        })

        eventsHooks.get().send(request, {
            action: ApplicationEventName.SIGNED_UP_USING_EMAIL,
            userId: request.principal.id,
            createdUser: {
                id: signUpResponse.id,
                email: signUpResponse.email,
            },
        })

        return signUpResponse
    })

    app.post('/sign-in', SignInRequestOptions, async (request) => {
        const platformId = await resolvePlatformIdForRequest(request)
        eventsHooks.get().send(request, {
            action: ApplicationEventName.SIGNED_IN,
            userId: request.principal.id,
        })
        return authenticationService.signIn({
            ...request.body,
            platformId,
            provider: Provider.EMAIL,
        })
    })
}

const rateLimitOptions: RateLimitOptions = {
    max: Number.parseInt(
        system.getOrThrow(SystemProp.API_RATE_LIMIT_AUTHN_MAX),
        10,
    ),
    timeWindow: system.getOrThrow(SystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
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
