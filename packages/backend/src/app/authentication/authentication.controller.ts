import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { RateLimitOptions } from '@fastify/rate-limit'
import { authenticationService } from './authentication-service'
import { resolvePlatformIdForRequest } from '../ee/platform/lib/platform-utils'
import { getEdition } from '../helper/secret-helper'
import { ApEdition, SignUpRequest, SignInRequest, ALL_PRINICPAL_TYPES } from '@activepieces/shared'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'

const edition = getEdition()

export const authenticationController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/sign-up', SignUpRequestOptions, async (request) => {
        const platformId = await resolvePlatformIdForRequest(request)

        return authenticationService.signUp({
            ...request.body,
            verified: edition === ApEdition.COMMUNITY,
            platformId,
        })
    })

    app.post('/sign-in', SignInRequestOptions, async (request) => {
        const platformId = await resolvePlatformIdForRequest(request)

        return authenticationService.signIn({
            ...request.body,
            platformId,
        })
    })
}

const rateLimitOptions: RateLimitOptions = {
    max: Number.parseInt(system.getOrThrow(SystemProp.API_RATE_LIMIT_AUTHN_MAX), 10),
    timeWindow: system.getOrThrow(SystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
}

const SignUpRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINICPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignUpRequest,
    },
}

const SignInRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINICPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignInRequest,
    },
}
