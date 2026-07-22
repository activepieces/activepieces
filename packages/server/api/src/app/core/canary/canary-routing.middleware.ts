import '@fastify/reply-from'
import { isNil, tryCatch } from '@activepieces/core-utils'
import { PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { workerGroupService } from '../../ee/platform/platform-plan/worker-group.service'
import { flowExecutionCache } from '../../flows/flow/flow-execution-cache'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { canaryCookie } from './canary-cookie'

export const canaryRoutingMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (request.headers.upgrade === 'websocket') return

    const canaryAppUrl = system.get(AppSystemProp.CANARY_APP_URL)
    if (isNil(canaryAppUrl)) return

    const { data: platformId, error: resolveError } = await tryCatch(() => resolvePlatformId(request, request.log))
    if (resolveError || isNil(platformId)) return

    const { data: shouldForward, error: canaryLookupError } = await tryCatch(() =>
        workerGroupService(request.log).isCanaryPlatform({ platformId }),
    )
    if (canaryLookupError) {
        request.log.error({ error: canaryLookupError }, '[canaryRoutingMiddleware] failed to fetch canary platform IDs, falling through')
        return
    }
    if (!shouldForward) {
        // Authoritative non-canary: drop a stale cookie (only if present, to stay off the hot path).
        if (canaryCookie.isPresent(request)) {
            canaryCookie.clear(reply)
        }
        return
    }

    request.log.info({ platform: { id: platformId } }, '[canaryRoutingMiddleware] proxying to canary')

    // Cookie steers the pre-principal surfaces (static bundle, ws upgrade) to canary too.
    const setCookie = canaryCookie.buildSetHeader(request.server)
    await awaitProxy(request, reply, setCookie)
}

async function awaitProxy(request: FastifyRequest, reply: FastifyReply, setCookie: string): Promise<void> {
    return new Promise<void>((resolve) => {
        reply.raw.once('finish', resolve)
        void reply.from(request.url, {
            rewriteHeaders: (headers) => ({
                ...headers,
                'set-cookie': mergeSetCookie(headers['set-cookie'], setCookie),
            }),
            onError: (reply, { error: proxyError }) => {
                request.log.error({ error: proxyError }, '[canaryRoutingMiddleware] proxy failed')
                void reply.send(proxyError)
            },
        })
    })
}

function mergeSetCookie(upstream: string | string[] | undefined, canary: string): string[] {
    if (isNil(upstream)) {
        return [canary]
    }
    const existing = Array.isArray(upstream) ? upstream : [upstream]
    return [...existing, canary]
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
