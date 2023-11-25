import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { SignInRequest, SignUpRequest, UserStatus } from '@activepieces/shared'
import { authenticationService } from './authentication-service'
import { resolvePlatformIdForRequest } from '../ee/platform/lib/platform-utils'

export const authenticationController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/sign-up', SignUpRequestOptions, async (request) => {
        const platformId = await resolvePlatformIdForRequest(request)

        return authenticationService.signUp({
            ...request.body,
            status: UserStatus.VERIFIED,
            platformId,
        })
    })

    app.post('/sign-in', SignInRequestOptions, async (request) => {
        return authenticationService.signIn(request.body)
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
