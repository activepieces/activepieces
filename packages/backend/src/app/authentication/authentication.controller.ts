import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { ApEdition, ApFlagId, SignInRequest, SignUpRequest, UserStatus } from '@activepieces/shared'
import { authenticationService } from './authentication-service'
import { flagService } from '../flags/flag.service'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { FastifyReply, FastifyRequest } from 'fastify'

export const authenticationController: FastifyPluginAsyncTypebox = async (app) => {
    app.post(
        '/sign-up',
        {
            schema: {
                body: SignUpRequest,
            },
        },
        async (request: FastifyRequest<{ Body: SignUpRequest }>, reply: FastifyReply) => {
            const userCreated = await flagService.getOne(ApFlagId.USER_CREATED)
            const signUpEnabled = system.getBoolean(SystemProp.SIGN_UP_ENABLED) ?? false
            const edition = system.get(SystemProp.EDITION) 
            if (userCreated && !signUpEnabled) {
                return reply.code(403).send({
                    message: 'Sign up is disabled',
                })
            }
            
            return authenticationService.signUp({
                ...request.body,
                status: edition === ApEdition.COMMUNITY ? UserStatus.VERIFIED : UserStatus.CREATED,
            })
        },
    )

    app.post(
        '/sign-in',
        {
            schema: {
                body: SignInRequest,
            },
        },
        async (request: FastifyRequest<{ Body: SignInRequest }>) => {
            return authenticationService.signIn(request.body)
        },
    )

}
