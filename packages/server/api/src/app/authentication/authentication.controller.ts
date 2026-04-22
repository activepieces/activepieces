import {
    ApplicationEventName,
    assertNotNullOrUndefined,
    isMfaChallenge,
    PrincipalType,
    SignInRequest,
    SignUpRequest,
    SwitchPlatformRequest,
    UserIdentityProvider,
} from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { applicationEvents } from '../helper/application-events'
import { networkUtils } from '../helper/network-utils'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { platformService } from '../platform/platform.service'
import { platformUtils } from '../platform/platform.utils'
import { userService } from '../user/user-service'
import { authenticationService } from './authentication.service'

export const authenticationController: FastifyPluginAsyncZod = async (
    app,
) => {
    app.post('/sign-up', SignUpRequestOptions, async (request, reply) => {

        const platformId = await platformUtils.getPlatformIdForRequest(request)
        const { result, responseHeaders } = await authenticationService(request.log).signUp({
            ...request.body,
            provider: UserIdentityProvider.EMAIL,
            platformId: platformId ?? null,
        })

        if (responseHeaders) {
            const cookies = responseHeaders.getSetCookie ? responseHeaders.getSetCookie() : (responseHeaders.get('set-cookie') ? [responseHeaders.get('set-cookie')!] : [])
            for (const cookie of cookies) {
                void reply.header('set-cookie', cookie)
            }
        }

        if (!isMfaChallenge(result)) {
            applicationEvents(request.log).sendUserEvent({
                platformId: result.platformId!,
                userId: result.id,
                projectId: result.projectId,
                ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
            }, {
                action: ApplicationEventName.USER_SIGNED_UP,
                data: {
                    source: 'credentials',
                },
            })
        }

        return reply.send(result)
    })

    app.post('/sign-in', SignInRequestOptions, async (request, reply) => {

        const predefinedPlatformId = await platformUtils.getPlatformIdForRequest(request)
        const { result, responseHeaders } = await authenticationService(request.log).signInWithPassword({
            email: request.body.email,
            password: request.body.password,
            predefinedPlatformId,
        })

        if (responseHeaders) {
            const cookies = responseHeaders.getSetCookie ? responseHeaders.getSetCookie() : (responseHeaders.get('set-cookie') ? [responseHeaders.get('set-cookie')!] : [])
            for (const cookie of cookies) {
                void reply.header('set-cookie', cookie)
            }
        }

        if (isMfaChallenge(result)) {
            return reply.send(result)
        }

        const responsePlatformId = result.platformId
        assertNotNullOrUndefined(responsePlatformId, 'Platform ID is required')
        applicationEvents(request.log).sendUserEvent({
            platformId: responsePlatformId,
            userId: result.id,
            projectId: result.projectId,
            ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_IN,
            data: {},
        })

        return reply.send(result)
    })

    app.get('/federated-provider-id', FederatedProviderIdRequestOptions, async (request) => {
        const platformId = await platformUtils.getPlatformIdForRequest(request)
        const providerName = request.query.providerName
        if (platformId) {
            const platform = await platformService(request.log).getOne(platformId)
            if (providerName === 'saml' && platform?.federatedAuthProviders?.saml) {
                return { providerId: `saml-${platformId}` }
            }
            if (providerName === 'google' && platform?.federatedAuthProviders?.google) {
                return { providerId: `google-${platformId}` }
            }
        }
        if (providerName === 'saml') {
            return { providerId: null }
        }
        return { providerId: `${providerName}-default` }
    })

    app.post('/switch-platform', SwitchPlatformRequestOptions, async (request) => {
        const user = await userService(request.log).getOneOrFail({ id: request.principal.id })
        return authenticationService(request.log).switchPlatform({
            identityId: user.identityId,
            platformId: request.body.platformId,
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



const SwitchPlatformRequestOptions = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SwitchPlatformRequest,
    },
}

const SignUpRequestOptions = {
    config: {
        security: securityAccess.public(),
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignUpRequest,
    },
}

const SignInRequestOptions = {
    config: {
        security: securityAccess.public(),
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignInRequest,
    },
}

const FederatedProviderIdRequestOptions = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        querystring: z.object({
            providerName: z.enum(['google', 'github', 'saml']),
        }),
        response: {
            [StatusCodes.OK]: z.object({ providerId: z.string().nullable() }),
        },
    },
}
