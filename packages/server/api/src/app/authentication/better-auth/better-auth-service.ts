import { ActivepiecesError, ApplicationEventName, assertNotNullOrUndefined, ErrorCode, isMfaChallenge, OtpType, tryCatch, UserIdentityProvider } from '@activepieces/shared'
import { AuthContext, GenericEndpointContext, MiddlewareContext, MiddlewareOptions } from 'better-auth/*'
import { getOAuthState } from 'better-auth/api'
import { BetterAuthOptions, Session, User } from 'better-auth/types'
import { FastifyBaseLogger } from 'fastify'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { emailService } from '../../ee/helper/email/email-service'
import { applicationEvents } from '../../helper/application-events'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { userService } from '../../user/user-service'
import { authenticationService } from '../authentication.service'
import { userIdentityRepository } from '../user-identity/user-identity-service'

type SentData = {
    user: User
    url: string
    token: string
}

type IBetterAuthService = {
    sendResetPassword: (data: SentData, request: Request | undefined) => Promise<void>
    sendVerificationEmail: (data: SentData, request: Request | undefined) => Promise<void>
    postCreateSession: (session: Session, ctx: GenericEndpointContext | null) => Promise<void>

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
    postCreateSession: async (_session, _ctx) => {
        return
    },
    beforeHook: async (_ctx) => {
        return
    },
    afterHook: async (ctx) => {
        const isSsoOidcCallback = ctx.path === '/sso/callback'
        const isSsoSamlCallback = ctx.path.startsWith('/sso/saml2/callback/')

        if (isSsoOidcCallback || isSsoSamlCallback) {
            // If null, the SSO callback failed (error redirect) — let it pass through.
            const identityId = ctx.context.newSession?.user.id
            if (!identityId) {
                log.warn({ path: ctx.path }, '[afterHook] newSession is null — SSO callback likely failed, letting error redirect pass through')
                return
            }

            let ssoProviderId: string = ''
            if (isSsoSamlCallback) {
                assertNotNullOrUndefined(ctx.request, 'ctx.request')
                ssoProviderId = new URL(ctx.request.url).pathname.split('/').pop()!
            }
            if (isSsoOidcCallback) {
                const state = await getOAuthState()
                assertNotNullOrUndefined(state, 'state')
                ssoProviderId = state.ssoProviderId
            }

            const provider = ssoProviderId.startsWith('saml-')
                ? UserIdentityProvider.SAML
                : UserIdentityProvider.GOOGLE

            await userIdentityRepository().update(identityId, { provider })

            const platformId = extractPlatformIdFromProviderId(ssoProviderId)
            const state = JSON.stringify({ provider: null, from: null })

            const existingUsers = await userService(log).getByIdentityId({ identityId })
            const isNewUser = existingUsers.length === 0

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
                action: isNewUser ? ApplicationEventName.USER_SIGNED_UP : ApplicationEventName.USER_SIGNED_IN,
                data: {
                    source: 'sso',
                },
            })

            throw ctx.redirect(`${redirectBaseUrl}?response=${JSON.stringify(response)}&state=${state}`)
        }
    },

})

function extractPlatformIdFromProviderId(providerId: string): string | undefined {
    for (const prefix of ['google-', 'saml-']) {
        if (providerId.startsWith(prefix)) {
            const candidate = providerId.slice(prefix.length)
            return candidate === 'default' ? undefined : candidate
        }
    }
    return undefined
}

const platformIdFromRequestQuery = (request: Request | undefined) => {
    if (request) {
        try {
            return new URL(request.url).searchParams.get('platformId')
        }
        catch {
            return null
        }
    }
    return null
}
