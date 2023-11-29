import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { authenticationService } from './authentication-service'
import { resolvePlatformIdForRequest } from '../ee/platform/lib/platform-utils'
import { getEdition } from '../helper/secret-helper'
import { ApEdition, UserStatus, SignUpRequest, SignInRequest } from '@activepieces/shared'

const edition = getEdition()

export const authenticationController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/sign-up', SignUpRequestOptions, async (request) => {
        const platformId = await resolvePlatformIdForRequest(request)

        return authenticationService.signUp({
            ...request.body,
            status: edition === ApEdition.COMMUNITY ? UserStatus.VERIFIED : UserStatus.CREATED,
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
    schema: {
        body: SignUpRequest,
    },
}

const SignInRequestOptions = {
    schema: {
        body: SignInRequest,
    },
}
