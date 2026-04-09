import '@fastify/reply-from'
import { isNil, PrincipalType, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { workerGroupService } from '../../ee/platform/platform-plan/worker-group.service'
import { flowExecutionCache } from '../../flows/flow/flow-execution-cache'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

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
        request.log.error({ err: canaryLookupError }, '[canaryRoutingMiddleware] failed to fetch canary platform IDs, falling through')
        return
    }
    if (!shouldForward) return

    request.log.info({ platformId }, '[canaryRoutingMiddleware] proxying to canary')

    await awaitProxy(request, reply)
}

async function awaitProxy(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    return new Promise<void>((resolve) => {
        reply.raw.once('finish', resolve)
        void reply.from(request.url, {
            onError: (reply, { error: proxyError }) => {
                request.log.error({ err: proxyError }, '[canaryRoutingMiddleware] proxy failed')
                void reply.send(proxyError)
            },
        })
    })
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
