import { Readable } from 'stream'
import { isMultipartFile, isNil, PrincipalType, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { flowExecutionCache } from '../../flows/flow/flow-execution-cache'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

export const canaryProxy = (request: FastifyRequest, reply: FastifyReply) => {

    return {
        async canaryRoutingMiddleware(): Promise<void> {
            if (request.headers.upgrade === 'websocket') return

            const canaryAppUrl = system.get(AppSystemProp.CANARY_APP_URL)
            const canaryPlatformIds = system.getList(AppSystemProp.CANARY_PLATFORM_IDS)
            if (isNil(canaryAppUrl) || isNil(canaryPlatformIds)) return

            const { data: platformId, error } = await tryCatch(() => resolvePlatformId(request, request.log))
            if (error || isNil(platformId) || !canaryPlatformIds.includes(platformId)) return

            request.log.info({ platformId }, '[canaryRoutingMiddleware] proxying to canary')

            const { error: proxyError } = await tryCatch(() => this.proxyToCanary(canaryAppUrl))
            if (proxyError) {
                if (reply.sent) {
                    request.log.error({ err: proxyError }, '[canaryRoutingMiddleware] proxy failed mid-stream')
                    return
                }
                request.log.error({ err: proxyError }, '[canaryRoutingMiddleware] proxy failed, falling back to primary')
            }
        },

        async proxyToCanary(canaryAppUrl: string): Promise<void> {
            const targetUrl = `${canaryAppUrl.replace(/\/$/, '')}${request.url}`
            const body = this.buildProxyBody()
            const headers = this.buildProxyHeaders(body instanceof FormData)

            request.log.info({ targetUrl, headers: redactSensitiveHeaders(headers) }, '[canaryRoutingMiddleware] forwarding request')

            const response = await fetch(targetUrl, {
                method: request.method,
                headers,
                body,
                // @ts-expect-error: duplex is required for non-null bodies in Node.js fetch
                duplex: 'half',
            })

            const responseHeaders: Record<string, string> = {}
            response.headers.forEach((value, key) => {
                if (!HOP_BY_HOP_HEADERS.has(key)) {
                    responseHeaders[key] = value
                }
            })

            const responseBody = response.body
                ? Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0])
                : null

            await reply.status(response.status).headers(responseHeaders).send(responseBody)
        },

        buildProxyBody(): BodyInit | null {
            const { method, body } = request
            if (method === 'GET' || method === 'HEAD') return null
            if (isNil(body)) return null
            if (request.isMultipart()) {
                const formData = new FormData()
                for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
                    if (isMultipartFile(value)) {
                        formData.append(key, new Blob([new Uint8Array(value.data)], { type: value.mimetype }), value.filename)
                    }
                    else {
                        formData.append(key, String(value))
                    }
                }
                return formData
            }
            if (Buffer.isBuffer(body)) return body as BodyInit
            if (typeof body === 'string') return body
            return JSON.stringify(body)
        },

        buildProxyHeaders(isFormData: boolean): Record<string, string> {
            const headers: Record<string, string> = {}
            for (const [key, value] of Object.entries(request.headers)) {
                if (isFormData && key === 'content-type') continue
                if (HOP_BY_HOP_HEADERS.has(key)) continue
                if (isNil(value)) continue
                headers[key] = Array.isArray(value) ? value.join(', ') : value
            }
            return headers
        },

    }
}

async function resolvePlatformId(request: FastifyRequest, log: FastifyBaseLogger): Promise<string | null> {
    const principal = request.principal
    if (!isNil(principal)) {
        const resolvedFromPrincipal = principal.type === PrincipalType.USER
            || principal.type === PrincipalType.SERVICE
            || principal.type === PrincipalType.ENGINE
        if (resolvedFromPrincipal) {
            return principal.platform.id
        }
    }

    const flowId = (request.params as Record<string, string>).flowId
    if (!isNil(flowId)) {
        const cacheResult = await flowExecutionCache(log).get({ flowId, simulate: false })
        if (cacheResult.exists) {
            return cacheResult.platformId
        }
    }

    return null
}

function redactSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
    const SENSITIVE = new Set(['authorization', 'cookie'])
    return Object.fromEntries(Object.entries(headers).filter(([k]) => !SENSITIVE.has(k)))
}

const HOP_BY_HOP_HEADERS = new Set([
    'host',
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
    'content-length',
])
