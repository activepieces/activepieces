import { ActivepiecesError, ApplicationEventName, assertNotNullOrUndefined, ErrorCode, isMfaChallenge, OtpType, tryCatch } from '@activepieces/shared'
import { AuthContext, MiddlewareContext, MiddlewareOptions } from 'better-auth/*'
import { getOAuthState } from 'better-auth/api'
import { BetterAuthOptions, User } from 'better-auth/types'
import { FastifyBaseLogger } from 'fastify'
import { platformUtils } from 'src/app/platform/platform.utils'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { emailService } from '../../ee/helper/email/email-service'
import { applicationEvents } from '../../helper/application-events'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { authenticationService } from '../authentication.service'

type SentData = {
    user: User
    url: string
    token: string
}

type IBetterAuthService = {
    sendResetPassword: (data: SentData, request: Request | undefined) => Promise<void>
    sendVerificationEmail: (data: SentData, request: Request | undefined) => Promise<void>

    beforeHook: (inputContext: MiddlewareContext<MiddlewareOptions, AuthContext<BetterAuthOptions> & {
        returned?: unknown
        responseHeaders?: Headers | undefined
    }>) => Promise<unknown>

    afterHook: (inputContext: MiddlewareContext<MiddlewareOptions, AuthContext<BetterAuthOptions> & {
        returned?: unknown
        responseHeaders?: Headers | undefined
    }>) => Promise<unknown>
}

export const betterAuthService = (log: FastifyBaseLogger): IBetterAuthService => ({
    sendResetPassword: async (data, request) => {
        await emailService(log).sendOtp({
            userIdentity: data.user,
            platformId: platformIdFromRequestQuery(request),
            otp: encodeURIComponent(data.token),
            type: OtpType.PASSWORD_RESET,
        })
    },

    sendVerificationEmail: async (data, request) => {
        await emailService(log).sendOtp({
            userIdentity: data.user,
            platformId: platformIdFromRequestQuery(request),
            otp: encodeURIComponent(data.token),
            type: OtpType.EMAIL_VERIFICATION,
        })
    },

    beforeHook: async (_ctx) => {
        return
    },
    afterHook: async (ctx) => {
        if (ctx.path.startsWith('/callback')) {
            const identityId = ctx.context.newSession?.user.id
            assertNotNullOrUndefined(identityId, 'identityId')
            const oAuthState = await getOAuthState()
            const platformId = oAuthState?.platformId ?? await platformUtils.getPlatformIdForRequest({
                log,
            })
            const state = JSON.stringify({
                provider: oAuthState?.provider,
                from: oAuthState?.from,
            })

            const { data: response, error } = await tryCatch(async () => authenticationService(log).socialSignIn({
                identityId,
                predefinedPlatformId: platformId,
            }))

            const redirectBaseUrl = await domainHelper.getPublicUrl({ path: '/redirect' })

            if (error) {
                const apError = error instanceof ActivepiecesError
                    ? error.error
                    : { code: ErrorCode.AUTHENTICATION, params: { message: 'Authentication failed' } }
                throw ctx.redirect(`${redirectBaseUrl}?error=${encodeURIComponent(JSON.stringify(apError))}&state=${state}`)
            }

            if (isMfaChallenge(response)) {
                if (response.setupRequired) {
                    throw ctx.redirect(`${redirectBaseUrl}?mfa=setup&enforced=${response.enforced ?? true}&state=${state}`)
                }
                throw ctx.redirect(`${redirectBaseUrl}?mfa=verify&state=${state}`)
            }

            applicationEvents(log).sendUserEvent({
                platformId: response.platformId!,
                userId: response.id,
                projectId: response.projectId,
                ip: ctx.request!.headers.get(system.get(AppSystemProp.CLIENT_REAL_IP_HEADER) ?? '') ?? '',
            }, {
                action: ApplicationEventName.USER_SIGNED_UP,
                data: {
                    source: 'sso',
                },
            })

            throw ctx.redirect(`${redirectBaseUrl}?response=${JSON.stringify(response)}&state=${state}`)
        }
    },

})

const platformIdFromRequestQuery = (request: Request | undefined) => {
    if (request) {
        const queryParams = new URLSearchParams(request.url)
        return queryParams.get('platformId')
    }
    return null
}
