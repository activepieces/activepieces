import { PrincipalType } from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { FastifyReply } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { platformUtils } from '../../platform/platform.utils'
import { twoFactorService } from './two-factor-service'

export const twoFactorController: FastifyPluginAsyncZod = async (app) => {

    app.post('/enable', {
        config: {
            security: securityAccess.public(),
            rateLimit: standardRateLimit,
        },
        schema: {
            body: z.object({
                password: z.string().optional(),
            }),
        },
    }, async (request, reply) => {
        const { result, responseHeaders } = await twoFactorService(request.log).enable({
            password: request.body.password,
            cookie: request.headers.cookie ?? '',
        })
        forwardSessionCookies(reply, responseHeaders)
        return reply.send(result)
    })

    app.post('/verify-totp', {
        config: {
            security: securityAccess.public(),
            rateLimit: strictRateLimit,
        },
        schema: {
            body: z.object({
                code: z.string(),
            }),
        },
    }, async (request, reply) => {
        const predefinedPlatformId = await platformUtils.getPlatformIdForRequest(request)
        const { result, responseHeaders } = await twoFactorService(request.log).verifyTotp({
            code: request.body.code,
            cookie: request.headers.cookie ?? '',
            predefinedPlatformId,
        })
        forwardSessionCookies(reply, responseHeaders)
        return reply.send(result)
    })

    app.post('/verify-backup-code', {
        config: {
            security: securityAccess.public(),
            rateLimit: strictRateLimit,
        },
        schema: {
            body: z.object({
                code: z.string(),
            }),
        },
    }, async (request, reply) => {
        const predefinedPlatformId = await platformUtils.getPlatformIdForRequest(request)
        const { result, responseHeaders } = await twoFactorService(request.log).verifyBackupCode({
            code: request.body.code,
            cookie: request.headers.cookie ?? '',
            predefinedPlatformId,
        })
        forwardSessionCookies(reply, responseHeaders)
        return reply.send(result)
    })

    app.post('/disable', {
        config: {
            security: securityAccess.public(),
            rateLimit: standardRateLimit,
        },
        schema: {
            body: z.object({
                password: z.string().optional(),
            }),
        },
    }, async (request, reply) => {
        const { result, responseHeaders } = await twoFactorService(request.log).disable({
            password: request.body.password,
            cookie: request.headers.cookie ?? '',
        })
        forwardSessionCookies(reply, responseHeaders)
        return reply.send(result)
    })

    app.get('/status', {
        config: {
            security: securityAccess.publicPlatform([PrincipalType.USER]),
        },
        schema: {},
    }, async (request) => {
        return twoFactorService(request.log).getStatus({ userId: request.principal.id })
    })

    app.post('/generate-backup-codes', {
        config: {
            security: securityAccess.publicPlatform(),
            rateLimit: strictRateLimit,
        },
        schema: {
            body: z.object({
                password: z.string().optional(),
            }),
        },
    }, async (request, reply) => {
        const { result, responseHeaders } = await twoFactorService(request.log).generateBackupCodes({
            password: request.body.password,
            cookie: request.headers.cookie ?? '',
        })
        forwardSessionCookies(reply, responseHeaders)
        return reply.send(result)
    })
}

function forwardSessionCookies(reply: FastifyReply, responseHeaders: Headers | null): void {
    if (!responseHeaders) return
    const cookies = responseHeaders.getSetCookie ? responseHeaders.getSetCookie() : (responseHeaders.get('set-cookie') ? [responseHeaders.get('set-cookie')!] : [])
    for (const cookie of cookies) {
        void reply.header('set-cookie', cookie)
    }
}

const standardRateLimit: RateLimitOptions = {
    max: Number.parseInt(system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_MAX), 10),
    timeWindow: system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
}

const strictRateLimit: RateLimitOptions = {
    max: 3,
    timeWindow: '60 seconds',
}
