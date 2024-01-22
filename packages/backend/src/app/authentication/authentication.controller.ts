import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { authenticationService } from './authentication-service'
import { resolvePlatformIdForRequest } from '../platform/lib/platform-utils'
import { getEdition } from '../helper/secret-helper'
import { ApEdition, SignUpRequest, SignInRequest, ALL_PRINICPAL_TYPES } from '@activepieces/shared'

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

const SignUpRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINICPAL_TYPES,
    },
    schema: {
        body: SignUpRequest,
    },
}

const SignInRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINICPAL_TYPES,
    },
    schema: {
        body: SignInRequest,
    },
}
