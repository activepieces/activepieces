import '@fastify/reply-from'
import { isNil } from '@activepieces/core-utils'
import { FastifyReply, FastifyRequest } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { canaryCookie } from './canary-cookie'

// Backend surfaces route themselves (/api is principal-based, the rest are backend/discovery);
// everything else is the frontend surface. See .agents/features/canary.md.
const BACKEND_PREFIXES = ['/api', '/mcp', '/ingest', '/.well-known']

export const canaryStaticRoutingMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // ws upgrades go through the dedicated upgrade proxy, not here.
    if (request.headers.upgrade === 'websocket') return

    const pathOnly = request.url.split('?')[0]
    if (BACKEND_PREFIXES.some((prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`))) return

    const canaryAppUrl = system.get(AppSystemProp.CANARY_APP_URL)
    if (isNil(canaryAppUrl)) return

    if (!canaryCookie.isValidHeader(request.server, request.headers.cookie)) return

    request.log.info({ url: request.url }, '[canaryStaticRoutingMiddleware] proxying frontend to canary')
    await awaitProxy(request, reply)
}

async function awaitProxy(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    return new Promise<void>((resolve) => {
        reply.raw.once('finish', resolve)
        void reply.from(request.url, {
            onError: (reply, { error: proxyError }) => {
                request.log.error({ error: proxyError }, '[canaryStaticRoutingMiddleware] proxy failed')
                void reply.send(proxyError)
            },
        })
    })
}
