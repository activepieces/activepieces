import { Readable } from 'stream'
import { isMultipartFile, isNil, PrincipalType, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { flowExecutionCache } from '../../flows/flow/flow-execution-cache'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

export const canaryRoutingMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const canaryAppUrl = system.get(AppSystemProp.CANARY_APP_URL)
    if (isNil(canaryAppUrl)) return

    if (request.headers.upgrade === 'websocket') return

    const { data: platformId, error } = await tryCatch(() => resolvePlatformId(request, request.log))
    if (error || isNil(platformId)) return

    const canaryPlatformIds = system.getList(AppSystemProp.CANARY_PLATFORM_IDS)
    const isCanary = canaryPlatformIds.includes(platformId)
    if (!isCanary) return

    request.log.info({ platformId }, '[canaryRoutingMiddleware] Proxying to canary app')
    const { error: proxyError } = await tryCatch(() => proxyToCanary(request, reply, canaryAppUrl))
    if (proxyError) {
        request.log.error({ err: proxyError }, '[canaryRoutingMiddleware] Canary proxy failed, falling back to primary handler')
    }
}

async function proxyToCanary(request: FastifyRequest, reply: FastifyReply, canaryAppUrl: string): Promise<void> {
    const targetUrl = `${canaryAppUrl.replace(/\/$/, '')}${request.url}`
    const body = buildProxyBody(request)
    const isFormData = body instanceof FormData

    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(request.headers)) {
        // Let fetch set content-type automatically for FormData (includes correct boundary)
        if (isFormData && key === 'content-type') continue
        if (!HOP_BY_HOP_HEADERS.has(key) && !isNil(value)) {
            headers[key] = Array.isArray(value) ? value.join(', ') : value
        }
    }

    request.log.info({ targetUrl, headers, body }, '[canaryRoutingMiddleware] Fetching from canary app')

    const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
        // @ts-expect-error: duplex is required for non-null bodies in Node.js fetch
        duplex: 'half',
    })
    
    request.log.info({ response }, '[canaryRoutingMiddleware] Response from canary app')

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
}

async function resolvePlatformId(request: FastifyRequest, log: FastifyBaseLogger): Promise<string | null> {
    const principal = request.principal

    if (!isNil(principal)) {
        if (
            principal.type === PrincipalType.USER ||
            principal.type === PrincipalType.SERVICE ||
            principal.type === PrincipalType.ENGINE
        ) {
            return principal.platform.id
        }
    }

    const params = request.params as Record<string, string>
    const flowId = params.flowId
    if (!isNil(flowId)) {
        const cacheResult = await flowExecutionCache(log).get({ flowId, simulate: false })
        if (cacheResult.exists) {
            return cacheResult.platformId
        }
    }

    return null
}

function buildProxyBody(request: FastifyRequest): BodyInit | null {
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
