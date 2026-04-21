import { assertNotNullOrUndefined } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { platformUtils } from '../../platform/platform.utils'
import { betterAuthInstance } from './auth'

export const betterAuthController: FastifyPluginAsyncZod = async (app) => {
    app.route({
        method: ['GET', 'POST'],
        url: '/v1/better-auth/*',
        async handler(request, reply) {
            try {
                const response = await betterAuthInstance.get().handler(toWebRequest({ url: request.url, headers: request.headers as Record<string, string | string[] | undefined>, method: request.method, body: request.body, ip: request.ip }))

                void reply.status(response.status)
                response.headers.forEach((value, key) => {
                    void reply.header(key, value)
                })
                void reply.send(response.body ? await response.text() : null)
            }
            catch (error) {
                request.log.error({ err: error }, '[better-auth] Unhandled authentication error')
                void reply.status(500).send({
                    error: 'Internal authentication error',
                    code: 'AUTH_FAILURE',
                })
            }
        },
    })

    // Backward-compatible SAML ACS route so existing IdP configurations don't need to change their ACS URL
    app.post('/v1/authn/saml/acs', {
        config: { security: securityAccess.public() },
        schema: { body: z.record(z.string(), z.unknown()) },
    }, async (request, reply) => {
        const platformId = await platformUtils.getPlatformIdForRequest(request)
        assertNotNullOrUndefined(platformId, 'platformId')
        const providerId = `saml-${platformId}`
        const targetPath = `/v1/better-auth/sso/saml2/callback/${providerId}`
        const targetUrl = new URL(targetPath, `http://${request.headers.host}`)

        const response = await betterAuthInstance.get().handler(toWebRequest({ url: request.url, headers: request.headers as Record<string, string | string[] | undefined>, method: request.method, body: request.body, ip: request.ip }, targetUrl))

        void reply.status(response.status)
        response.headers.forEach((value, key) => {
            void reply.header(key, value)
        })
        void reply.send(response.body ? await response.text() : null)
    })
}

function toWebRequest(request: { url: string, headers: Record<string, string | string[] | undefined>, method: string, body?: unknown, ip?: string }, overrideUrl?: URL): Request {
    const url = overrideUrl ?? new URL(request.url, `http://${request.headers.host}`)
    const headers = new Headers()
    for (const [key, value] of Object.entries(request.headers)) {
        if (value) headers.append(key, value.toString())
    }
    const clientIpHeader = system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)
    if (clientIpHeader && !headers.has(clientIpHeader) && request.ip) {
        headers.set(clientIpHeader, request.ip)
    }
    if (!headers.has('x-forwarded-for') && request.ip) {
        headers.set('x-forwarded-for', request.ip)
    }
    const contentType = headers.get('content-type') ?? ''
    const isFormEncoded = contentType.includes('application/x-www-form-urlencoded')

    let body: string | undefined
    if (request.body) {
        body = isFormEncoded
            ? new URLSearchParams(request.body as Record<string, string>).toString()
            : JSON.stringify(request.body)
    }

    return new Request(url.toString(), {
        method: request.method,
        headers,
        body,
    })
}
